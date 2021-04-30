const StarNotary = artifacts.require("StarNotary");
const TruffleAssert = require("truffle-assertions");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
    const user1 = accounts[1];
    const user2 = accounts[2];
    const user3 = accounts[3];

    it('can Create a Star', async() => {
        let instance = await StarNotary.new({from: owner});
        let tokenId = 1;
        await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
        let star = await instance.tokenIdToStarInfo.call(tokenId);
        assert.equal(await star.name, 'Awesome Star!')
    });

    it('lets user1 put up their star for sale', async() => {
        let instance = await StarNotary.new({from: owner});
        let starId = 2;
        let starPrice = web3.utils.toWei(".01", "ether");
        await instance.createStar('awesome star', starId, {from: user1});
        await instance.putStarUpForSale(starId, starPrice, {from: user1});
        assert.equal(await instance.starsForSale.call(starId), starPrice);
    });

    it('lets user1 get the funds after the sale', async() => {
        let instance = await StarNotary.new({from: owner});
        let starId = 3;
        let starPrice = web3.utils.toWei(".01", "ether");
        let balance = web3.utils.toWei(".05", "ether");
        await instance.createStar('awesome star', starId, {from: user1});
        await instance.putStarUpForSale(starId, starPrice, {from: user1});
        let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
        await instance.buyStar(starId, {from: user2, value: balance});
        let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
        let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
        let value2 = Number(balanceOfUser1AfterTransaction);
        assert.equal(value1, value2);
    });

    it('lets user2 buy a star, if it is put up for sale', async() => {
        let instance = await StarNotary.new({from: owner});
        let starId = 4;
        let starPrice = web3.utils.toWei(".01", "ether");
        let balance = web3.utils.toWei(".05", "ether");
        await instance.createStar('awesome star', starId, {from: user1});
        await instance.putStarUpForSale(starId, starPrice, {from: user1});
        let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
        await instance.buyStar(starId, {from: user2, value: balance});
        assert.equal(await instance.ownerOf.call(starId), user2);
    });

    it('lets user2 buy a star and decreases its balance in ether', async() => {
        let instance = await StarNotary.new({from: owner});
        let starId = 5;
        let starPrice = web3.utils.toWei(".01", "ether");
        let balance = web3.utils.toWei(".05", "ether");
        await instance.createStar('awesome star', starId, {from: user1});
        await instance.putStarUpForSale(starId, starPrice, {from: user1});
        let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
        const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
        await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
        const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
        let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
        assert.equal(value, starPrice);
    });

    // Implement Task 2 Add supporting unit tests

    it('can add the star name and star symbol properly', async() => {
        // 1. create a Star with different tokenId
        let instance = await StarNotary.new({from: owner});
        await instance.createStar("Shiny Star", 1);
        let tokenSymbol = "STR";
        let shinyStarSymbol = await instance.getStarSymbol(1);
        
        assert.equal(shinyStarSymbol, tokenSymbol);
    });

    it('lets 2 users exchange stars', async() => {
        // 1. create 2 Stars with different tokenId
        let instance = await StarNotary.new({from: owner});
        await instance.createStar("Shiny Star 1", 1, {from: user1});
        await instance.createStar("Shiny Star 1", 2, {from: user2});
        
        // 2. Call the exchangeStars functions implemented in the Smart Contract
        await instance.exchangeStars(1, 2, {from: user1});
        
        // 3. Verify that the owners changed
        var shouldBeNewStar1Owner = await instance.ownerOf.call(1);
        let shouldBeNewStar2Owner = await instance.ownerOf.call(2);
        
        assert.equal(shouldBeNewStar1Owner, user2);
        assert.equal(shouldBeNewStar2Owner, user1);
    });

    it('forbids a user who doesn\'t own either star from exchanging', async() => {
        let instance = await StarNotary.new({from: owner});
        await instance.createStar("Shiny Star 1", 1, {from: user1});
        await instance.createStar("Shiny Star 1", 2, {from: user2});
        
        await TruffleAssert.reverts(instance.exchangeStars(1, 2, {from: user3}));
    });

    it('returns the contract\'s symbol', async() => {
        let instance = await StarNotary.new({from: owner});
        let symbol = await instance.symbol.call();
        
        assert.equal("STR", symbol);
    });

    it('lets a user transfer a star', async() => {
        // 1. create a Star with different tokenId
        let instance = await StarNotary.new({from: owner});
        let user6 = accounts[5];

        await instance.createStar("Shiny Star 1", 5, {from: user1});
        let transfer = await instance.transferStar(user6, 5, {from: user1});
        await TruffleAssert.eventEmitted(transfer, 'TransferredStar')
        let shouldbenewOwner = await instance.ownerOf.call(5);
        
        assert.equal(user6, shouldbenewOwner);
    });

    it('forbids a user from transfering stars he doesn\'t own', async() => {
        // 1. create a Star with different tokenId
        let instance = await StarNotary.new({from: owner});
        await instance.createStar("Shiny Star 1", 1, {from: user1});
        let user6 = accounts[5];
        
        await TruffleAssert.reverts(instance.transferStar(user6, 5, {from: user2}));
    });

    it('lookUptokenIdToStarInfo test', async() => {
        // 1. create a Star with different tokenId
        let instance = await StarNotary.new({from: owner});
        
        await instance.createStar("Shiny Star", 1);
        let result = await instance.lookUptokenIdToStarInfo.call(1);
        
        assert.equal("Shiny Star", result);
    });
});