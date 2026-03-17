// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract HealthWalletConsent {

    struct Document { // a document has 2 pieces of info: patient and hash
        address patient;
        string hash;
    }

    mapping(uint => Document) public documents; //stores documents by number

    mapping(uint => mapping(address => bool)) public access;

    uint public documentCount;

    function addDocument(address _patient, string memory _hash) public { //just adds a new document to the contract

        documents[documentCount] = Document(_patient, _hash);

        documentCount++;
    }

    function grantAccess(uint docId, address provider) public { //..grants access

        access[docId][provider] = true;
    }

    function revokeAccess(uint docId, address provider) public { //revokes access...
        access[docId][provider] = false;
    }

    function checkAccess(uint docId, address provider) public view returns (bool) { //returns whether the provider has access

        return access[docId][provider];
    }
}