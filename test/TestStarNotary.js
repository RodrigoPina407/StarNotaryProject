const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    await instance.approve(user2, starId, {from: user1});

    let balanceOfUser1BeforeTransaction = new web3.utils.BN(await web3.eth.getBalance(user1));
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = new web3.utils.BN(await web3.eth.getBalance(user1));

    let value1 = balanceOfUser1BeforeTransaction.add(new web3.utils.BN(starPrice));
    let value2 = balanceOfUser1AfterTransaction;

    assert(value1.eq(value2));
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    await instance.approve(user2, starId, {from: user1});
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    await instance.approve(user2, starId, {from: user1});

    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    const receipt = await instance.buyStar(starId, {from: user2, value: balance});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
   
    const tx = await web3.eth.getTransaction(receipt.tx);

    const gasPrice = new web3.utils.BN(tx.gasPrice);
    const gasUsage = new web3.utils.BN(receipt.receipt.gasUsed);
    const gasCost = gasPrice.mul(gasUsage);
    const price = new web3.utils.BN(starPrice);

    let value = new web3.utils.BN(balanceOfUser2BeforeTransaction).sub(new web3.utils.BN(balanceAfterUser2BuysStar)).sub(gasCost);

    assert(value.eq(price));
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 6;
    await instance.createStar('awesome star', starId, {from: user1});
    
    let name = await instance.name();
    let symbol = await instance.symbol();

    assert.equal(name, "StarsLedger", "Incorrect Name");
    assert.equal(symbol, "STR", "Incorrect Symbol");
    
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    // 3. Verify that the owners changed

    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId1 = 7;
    let starId2 = 8;
    await instance.createStar('awesome star 1', starId1, {from: user1});
    await instance.createStar('awesome star 2', starId2, {from: user2});

    await instance.approve(user1, starId2, {from: user2});

    await instance.exchangeStars(starId1, starId2, {from: user1});

    assert.equal(user1, await instance.ownerOf(starId2), "User 1 is not the owner of Star 2, exchange failed!");
    assert.equal(user2, await instance.ownerOf(starId1), "User 2 is not the owner of Star 1, exchange failed!");
});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    // 2. use the transferStar function implemented in the Smart Contract
    // 3. Verify the star owner changed.
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 9;

    await instance.createStar('awesome star', starId, {from: user1});

    await instance.transferStar(user2, starId, {from: user1});

    assert.equal(user2, await instance.ownerOf(starId), "Star was not transfered");
});

it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    // 2. Call your method lookUptokenIdToStarInfo
    // 3. Verify if you Star name is the same

    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 10;

    await instance.createStar('awesome star', starId, {from: user1});

    assert.equal('awesome star', await instance.lookUptokenIdToStarInfo(starId), "Star name does not match!");
});