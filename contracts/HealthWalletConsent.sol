// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HealthWalletConsent {

    struct Document { // a document has 2 pieces of info: patient and hash
        address patient;
        string hash;
    }

struct Access {

    bool granted;
    uint expiry;
}

    mapping(uint => Document) public documents; //stores documents by number

    mapping(uint => mapping(address => Access)) public access;

    uint public documentCount;

    modifier onlyPatient(uint docId) { //who is calling has to = who owns the document
        require(documents[docId].patient == msg.sender, "Not the patient");
        _;
    }

    function addDocument(address _patient, string memory _hash) public { //just adds a new document to the contract

        documents[documentCount] = Document(_patient, _hash);

        documentCount++;
    }

    function grantAccess(uint docId, address provider, uint expiry) public onlyPatient(docId) { //..grants access

        access[docId][provider] = Access(true, expiry);
    }

    function revokeAccess(uint docId, address provider) public onlyPatient(docId){ //revokes access...
        access[docId][provider].granted = false;
    }

    function checkAccess(uint docId, address provider) public view returns (bool) { //returns whether the provider has access

        Access memory a=access[docId][provider];

        return a.granted && a.expiry >block.timestamp;
    }
}