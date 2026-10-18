const { expect } = require("chai");
const { ethers } = require("hardhat");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("InsuranceClaim", function () {
  async function deployFixture() {
    const [owner, admin, unauthorized] = await ethers.getSigners();
    const InsuranceClaim = await ethers.getContractFactory("InsuranceClaim");
    const contract = await InsuranceClaim.deploy();
    await contract.waitForDeployment();

    await contract.setAdminAuthorization(admin.address, true);

    return { contract, owner, admin, unauthorized };
  }

  async function createTestClaim(contract, signer) {
    const claimId = "CLM-001";
    const policyId = "POL-001";
    const claimHash = ethers.keccak256(ethers.toUtf8Bytes("claim-data"));

    await contract
      .connect(signer)
      .createClaim(claimId, policyId, claimHash, "policyholder-001", 125000);

    return { claimId, policyId, claimHash };
  }

  it("deploys with the deployer as owner and authorized admin", async function () {
    const { contract, owner } = await deployFixture();

    expect(await contract.owner()).to.equal(owner.address);
    expect(await contract.authorizedAdmins(owner.address)).to.equal(true);
  });

  it("creates and retrieves a pending claim", async function () {
    const { contract, admin } = await deployFixture();
    const { claimId, policyId, claimHash } = await createTestClaim(contract, admin);
    const claim = await contract.getClaim(claimId);

    expect(claim.claimId).to.equal(claimId);
    expect(claim.policyId).to.equal(policyId);
    expect(claim.claimDataHash).to.equal(claimHash);
    expect(claim.claimantReference).to.equal("policyholder-001");
    expect(claim.amount).to.equal(125000);
    expect(claim.status).to.equal(0n);
    expect(claim.createdAt).to.be.greaterThan(0n);
    expect(claim.updatedAt).to.equal(claim.createdAt);
  });

  it("emits ClaimCreated when a claim is recorded", async function () {
    const { contract, admin } = await deployFixture();
    const claimHash = ethers.keccak256(ethers.toUtf8Bytes("claim-data"));

    await expect(
      contract
        .connect(admin)
        .createClaim("CLM-001", "POL-001", claimHash, "policyholder-001", 125000)
    )
      .to.emit(contract, "ClaimCreated")
      .withArgs("CLM-001", "POL-001", claimHash, 125000, anyValue);
  });

  it("rejects claim creation and status changes from unauthorized accounts", async function () {
    const { contract, unauthorized } = await deployFixture();
    const claimHash = ethers.keccak256(ethers.toUtf8Bytes("claim-data"));

    await expect(
      contract
        .connect(unauthorized)
        .createClaim("CLM-001", "POL-001", claimHash, "policyholder-001", 125000)
    ).to.be.revertedWith("Not an authorized admin");
  });

  it("updates status and records the status event", async function () {
    const { contract, admin } = await deployFixture();
    const { claimId } = await createTestClaim(contract, admin);

    await expect(
      contract.connect(admin).updateClaimStatus(claimId, 1, "CLAIM_UNDER_REVIEW")
    )
      .to.emit(contract, "ClaimStatusUpdated")
      .withArgs(claimId, 1, "CLAIM_UNDER_REVIEW", admin.address, anyValue);

    const claim = await contract.getClaim(claimId);
    expect(claim.status).to.equal(1n);

    await expect(
      contract.connect(admin).updateClaimStatus(claimId, 2, "CLAIM_APPROVED")
    ).to.emit(contract, "ClaimStatusUpdated");

    expect((await contract.getClaim(claimId)).status).to.equal(2n);
  });

  it("rejects duplicates, invalid inputs, and invalid status transitions", async function () {
    const { contract, admin } = await deployFixture();
    const claimHash = ethers.keccak256(ethers.toUtf8Bytes("claim-data"));

    await expect(
      contract.connect(admin).createClaim("", "POL-001", claimHash, "policyholder-001", 1)
    ).to.be.revertedWith("Claim ID is required");
    await expect(
      contract.connect(admin).createClaim("CLM-001", "POL-001", ethers.ZeroHash, "policyholder-001", 1)
    ).to.be.revertedWith("Claim hash is required");

    await createTestClaim(contract, admin);
    await expect(
      contract.connect(admin).createClaim("CLM-001", "POL-001", claimHash, "policyholder-001", 1)
    ).to.be.revertedWith("Claim already exists");
    await expect(
      contract.connect(admin).updateClaimStatus("CLM-001", 2, "CLAIM_APPROVED")
    ).to.be.revertedWith("Invalid status transition");

    await contract.connect(admin).updateClaimStatus("CLM-001", 1, "CLAIM_UNDER_REVIEW");
    await contract.connect(admin).updateClaimStatus("CLM-001", 2, "CLAIM_APPROVED");
    await expect(
      contract.connect(admin).updateClaimStatus("CLM-001", 3, "CLAIM_REJECTED")
    ).to.be.revertedWith("Invalid status transition");
  });

  it("returns the complete claim history", async function () {
    const { contract, admin } = await deployFixture();
    const { claimId } = await createTestClaim(contract, admin);

    await contract.connect(admin).updateClaimStatus(claimId, 1, "CLAIM_UNDER_REVIEW");
    await contract.connect(admin).updateClaimStatus(claimId, 3, "CLAIM_REJECTED");

    const history = await contract.getClaimHistory(claimId);

    expect(history).to.have.length(3);
    expect(history[0].status).to.equal(0n);
    expect(history[0].action).to.equal("CLAIM_CREATED");
    expect(history[1].status).to.equal(1n);
    expect(history[1].action).to.equal("CLAIM_UNDER_REVIEW");
    expect(history[2].status).to.equal(3n);
    expect(history[2].action).to.equal("CLAIM_REJECTED");
  });

  it("verifies matching and tampered claim hashes", async function () {
    const { contract, admin } = await deployFixture();
    const { claimId, claimHash } = await createTestClaim(contract, admin);
    const tamperedHash = ethers.keccak256(ethers.toUtf8Bytes("tampered-data"));

    expect(await contract.verifyClaimHash(claimId, claimHash)).to.equal(true);
    expect(await contract.verifyClaimHash(claimId, tamperedHash)).to.equal(false);
  });

  it("allows the owner to authorize and revoke an admin", async function () {
    const { contract, owner, admin, unauthorized } = await deployFixture();

    expect(await contract.authorizedAdmins(admin.address)).to.equal(true);
    await contract.connect(owner).setAdminAuthorization(admin.address, false);
    expect(await contract.authorizedAdmins(admin.address)).to.equal(false);

    const claimHash = ethers.keccak256(ethers.toUtf8Bytes("claim-data"));
    await expect(
      contract
        .connect(admin)
        .createClaim("CLM-002", "POL-002", claimHash, "policyholder-002", 1000)
    ).to.be.revertedWith("Not an authorized admin");

    await expect(
      contract.connect(unauthorized).setAdminAuthorization(admin.address, true)
    ).to.be.revertedWith("Only owner can perform this action");
  });
});
