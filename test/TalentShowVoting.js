const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { expect } = require("chai");

describe("DWGotTalent", function () {
  async function deployTalentShowFixture() {
    const [owner, judge1, judge2, finalist1, finalist2, audience1, audience2] =
      await ethers.getSigners();

    const TalentShow = await ethers.getContractFactory("WorldGotTalent");
    const talentShow = await TalentShow.deploy();

    return {
      talentShow,
      owner,
      judge1,
      judge2,
      finalist1,
      finalist2,
      audience1,
      audience2,
    };
  }

  async function deployReadyToVoteFixture() {
    const [owner, judge1, judge2, finalist1, finalist2, audience1, audience2] =
      await ethers.getSigners();

    const TalentShow = await ethers.getContractFactory("DWGotTalent");
    const talentShow = await TalentShow.deploy();

    await talentShow.selectJudges([judge1.address, judge2.address]);
    await talentShow.selectFinalists([finalist1.address, finalist2.address]);
    await talentShow.inputWeightage(10, 1);
    await talentShow.startVoting();

    return {
      talentShow,
      owner,
      judge1,
      judge2,
      finalist1,
      finalist2,
      audience1,
      audience2,
    };
  }

  describe("selectJudges", function () {
    it("should revert if caller is not owner", async function () {
      const { talentShow, judge1, judge2 } = await loadFixture(
        deployTalentShowFixture,
      );

      await expect(
        talentShow.connect(judge1).selectJudges([judge2.address]),
      ).to.be.revertedWithCustomError(talentShow, "NotOwner");
    });

    it("should revert if empty array", async function () {
      const { talentShow } = await loadFixture(deployTalentShowFixture);

      await expect(talentShow.selectJudges([])).to.be.revertedWithCustomError(
        talentShow,
        "InvalidAddress",
      );
    });

    it("should revert if address is zero", async function () {
      const { talentShow } = await loadFixture(deployTalentShowFixture);

      await expect(
        talentShow.selectJudges([ethers.ZeroAddress]),
      ).to.be.revertedWithCustomError(talentShow, "InvalidAddress");
    });

    it("should revert if finalist is added as judge", async function () {
      const { talentShow, judge1, finalist1 } = await loadFixture(
        deployTalentShowFixture,
      );

      await talentShow.selectFinalists([finalist1.address]);
      await expect(
        talentShow.selectJudges([finalist1.address]),
      ).to.be.revertedWithCustomError(talentShow, "FinalistCannotBeJudge");
    });

    it("should revert if voting has started", async function () {
      const { talentShow, judge1, judge2, finalist1 } = await loadFixture(
        deployTalentShowFixture,
      );

      await talentShow.selectJudges([judge1.address]);
      await talentShow.selectFinalists([finalist1.address]);
      await talentShow.inputWeightage(10, 1);
      await talentShow.startVoting();

      await expect(
        talentShow.selectJudges([judge2.address]),
      ).to.be.revertedWithCustomError(talentShow, "VotingAlreadyStarted");
    });

    it("should select judges correctly", async function () {
      const { talentShow, judge1, judge2 } = await loadFixture(
        deployTalentShowFixture,
      );

      await talentShow.selectJudges([judge1.address, judge2.address]);
      expect(await talentShow.isJudge(judge1.address)).to.equal(true);
      expect(await talentShow.isJudge(judge2.address)).to.equal(true);
    });

    it("should emit JudgesSelected event", async function () {
      const { talentShow, judge1 } = await loadFixture(deployTalentShowFixture);

      await expect(talentShow.selectJudges([judge1.address])).to.emit(
        talentShow,
        "JudgesSelected",
      );
    });
  });

  describe("selectFinalists", function () {
    it("should revert if caller is not owner", async function () {
      const { talentShow, judge1, finalist1 } = await loadFixture(
        deployTalentShowFixture,
      );

      await expect(
        talentShow.connect(judge1).selectFinalists([finalist1.address]),
      ).to.be.revertedWithCustomError(talentShow, "NotOwner");
    });

    it("should revert if judge is added as finalist", async function () {
      const { talentShow, judge1 } = await loadFixture(deployTalentShowFixture);

      await talentShow.selectJudges([judge1.address]);
      await expect(
        talentShow.selectFinalists([judge1.address]),
      ).to.be.revertedWithCustomError(talentShow, "FinalistCannotBeJudge");
    });

    it("should select finalists correctly", async function () {
      const { talentShow, finalist1, finalist2 } = await loadFixture(
        deployTalentShowFixture,
      );

      await talentShow.selectFinalists([finalist1.address, finalist2.address]);
      expect(await talentShow.isFinalist(finalist1.address)).to.equal(true);
      expect(await talentShow.isFinalist(finalist2.address)).to.equal(true);
    });

    it("should emit FinalistsSelected event", async function () {
      const { talentShow, finalist1 } = await loadFixture(
        deployTalentShowFixture,
      );

      await expect(talentShow.selectFinalists([finalist1.address])).to.emit(
        talentShow,
        "FinalistsSelected",
      );
    });
  });

  describe("inputWeightage", function () {
    it("should revert if caller is not owner", async function () {
      const { talentShow, judge1 } = await loadFixture(deployTalentShowFixture);

      await expect(
        talentShow.connect(judge1).inputWeightage(10, 1),
      ).to.be.revertedWithCustomError(talentShow, "NotOwner");
    });

    it("should revert if weightage is 0", async function () {
      const { talentShow } = await loadFixture(deployTalentShowFixture);

      await expect(
        talentShow.inputWeightage(0, 1),
      ).to.be.revertedWithCustomError(talentShow, "InvalidAddress");
    });

    it("should set weightage correctly", async function () {
      const { talentShow } = await loadFixture(deployTalentShowFixture);

      await talentShow.inputWeightage(10, 1);
      expect(await talentShow.judgeVote()).to.equal(10);
      expect(await talentShow.audienceVote()).to.equal(1);
    });

    it("should emit WeightageSet event", async function () {
      const { talentShow } = await loadFixture(deployTalentShowFixture);

      await expect(talentShow.inputWeightage(10, 1))
        .to.emit(talentShow, "WeightageSet")
        .withArgs(10, 1);
    });
  });

  describe("startVoting", function () {
    it("should revert if no judges or finalists", async function () {
      const { talentShow } = await loadFixture(deployTalentShowFixture);

      await expect(talentShow.startVoting()).to.be.revertedWithCustomError(
        talentShow,
        "NoJudgesOrFinalists",
      );
    });

    it("should revert if weightage not set", async function () {
      const { talentShow, judge1, finalist1 } = await loadFixture(
        deployTalentShowFixture,
      );

      await talentShow.selectJudges([judge1.address]);
      await talentShow.selectFinalists([finalist1.address]);
      await expect(talentShow.startVoting()).to.be.revertedWithCustomError(
        talentShow,
        "WeightageNotSet",
      );
    });

    it("should start voting correctly", async function () {
      const { talentShow, judge1, finalist1 } = await loadFixture(
        deployTalentShowFixture,
      );

      await talentShow.selectJudges([judge1.address]);
      await talentShow.selectFinalists([finalist1.address]);
      await talentShow.inputWeightage(10, 1);
      await talentShow.startVoting();
      expect(await talentShow.votingStarted()).to.equal(true);
    });

    it("should emit VotingStarted event", async function () {
      const { talentShow, judge1, finalist1 } = await loadFixture(
        deployTalentShowFixture,
      );

      await talentShow.selectJudges([judge1.address]);
      await talentShow.selectFinalists([finalist1.address]);
      await talentShow.inputWeightage(10, 1);
      await expect(talentShow.startVoting()).to.emit(
        talentShow,
        "VotingStarted",
      );
    });
  });

  describe("castVote", function () {
    it("should revert if voting not started", async function () {
      const { talentShow, audience1, finalist1 } = await loadFixture(
        deployTalentShowFixture,
      );

      await expect(
        talentShow.connect(audience1).castVote(finalist1.address),
      ).to.be.revertedWithCustomError(talentShow, "VotingNotStarted");
    });

    it("should revert if already voted", async function () {
      const { talentShow, audience1, finalist1 } = await loadFixture(
        deployReadyToVoteFixture,
      );

      await talentShow.connect(audience1).castVote(finalist1.address);
      await expect(
        talentShow.connect(audience1).castVote(finalist1.address),
      ).to.be.revertedWithCustomError(talentShow, "AlreadyVoted");
    });

    it("should revert if invalid finalist", async function () {
      const { talentShow, audience1, audience2 } = await loadFixture(
        deployReadyToVoteFixture,
      );

      await expect(
        talentShow.connect(audience1).castVote(audience2.address),
      ).to.be.revertedWithCustomError(talentShow, "InvalidFinalist");
    });

    it("should give judge higher vote weight", async function () {
      const { talentShow, judge1, finalist1 } = await loadFixture(
        deployReadyToVoteFixture,
      );

      await talentShow.connect(judge1).castVote(finalist1.address);
      expect(await talentShow.finalistsPoints(finalist1.address)).to.equal(10);
    });

    it("should give audience lower vote weight", async function () {
      const { talentShow, audience1, finalist1 } = await loadFixture(
        deployReadyToVoteFixture,
      );

      await talentShow.connect(audience1).castVote(finalist1.address);
      expect(await talentShow.finalistsPoints(finalist1.address)).to.equal(1);
    });

    it("should emit VoteCast event", async function () {
      const { talentShow, audience1, finalist1 } = await loadFixture(
        deployReadyToVoteFixture,
      );

      await expect(talentShow.connect(audience1).castVote(finalist1.address))
        .to.emit(talentShow, "VoteCast")
        .withArgs(audience1.address, finalist1.address, 1);
    });
  });

  describe("endVoting", function () {
    it("should revert if voting not started", async function () {
      const { talentShow } = await loadFixture(deployTalentShowFixture);

      await expect(talentShow.endVoting()).to.be.revertedWithCustomError(
        talentShow,
        "VotingNotStarted",
      );
    });

    it("should end voting correctly", async function () {
      const { talentShow, audience1, finalist1 } = await loadFixture(
        deployReadyToVoteFixture,
      );

      await talentShow.connect(audience1).castVote(finalist1.address);
      await talentShow.endVoting();
      expect(await talentShow.ended()).to.equal(true);
    });

    it("should set correct winner", async function () {
      const { talentShow, judge1, audience1, finalist1, finalist2 } =
        await loadFixture(deployReadyToVoteFixture);

      await talentShow.connect(judge1).castVote(finalist1.address);
      await talentShow.connect(audience1).castVote(finalist2.address);
      await talentShow.endVoting();

      const winners = await talentShow.showResult();
      expect(winners[0]).to.equal(finalist1.address);
    });

    it("should handle tie correctly", async function () {
      const { talentShow, audience1, audience2, finalist1, finalist2 } =
        await loadFixture(deployReadyToVoteFixture);

      await talentShow.connect(audience1).castVote(finalist1.address);
      await talentShow.connect(audience2).castVote(finalist2.address);
      await talentShow.endVoting();

      const winners = await talentShow.showResult();
      expect(winners.length).to.equal(2);
    });

    it("should emit VotingEnded event", async function () {
      const { talentShow, audience1, finalist1 } = await loadFixture(
        deployReadyToVoteFixture,
      );

      await talentShow.connect(audience1).castVote(finalist1.address);
      await expect(talentShow.endVoting()).to.emit(talentShow, "VotingEnded");
    });
  });

  describe("showResult", function () {
    it("should revert if voting not ended", async function () {
      const { talentShow } = await loadFixture(deployReadyToVoteFixture);

      await expect(talentShow.showResult()).to.be.revertedWithCustomError(
        talentShow,
        "VotingNotEnded",
      );
    });

    it("should return winners correctly", async function () {
      const { talentShow, judge1, finalist1 } = await loadFixture(
        deployReadyToVoteFixture,
      );

      await talentShow.connect(judge1).castVote(finalist1.address);
      await talentShow.endVoting();

      const winners = await talentShow.showResult();
      expect(winners[0]).to.equal(finalist1.address);
    });
  });
});
