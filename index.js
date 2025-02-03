"use strict";

/*
*   Class: CSCI 390 : Javascript Programming
*   Assignment: High Low Game
*   Author: George Chen
*   Date: 11/10/2022
*   
*   This program is a simple high low game, where the user will arbitrary guess what the number is via SMS.
*   If the number guessed is higher than the actual number, it will prompt the user that the number is too high.  
*   Similarly, in the case of a lower number. If user guessed the number, it will notify the user that
*   they guessed it correctly and asked if they wanted to request a new game. 
*/

//Global array var to store different users data
var playerData = [];

const express = require("express");
const bodyParser = require("body-parser");
const twilio = require("twilio");

let accountSID = ""
let authToken = ""

const client = new twilio(accountSID, authToken);

const MessagingResponse = require("twilio").twiml.MessagingResponse;

let app = express();

app.use(bodyParser.urlencoded({extended:false}));

app.post('/sms', function (request, response){
    
    //Some variables
    const twiml = new MessagingResponse();
    var randomNum;
    var playCounter;
    var found = false; //flag to check if the player is new or old
    var playerReturn = false; //flag to check if the player is a returning player
    var i = 0;

    // Check if the player data exist
    while ((!found) && (i < playerData.length)){
        if (request.body.From == playerData[i].accountNum){
            randomNum = playerData[i].randomNum;
            playCounter = playerData[i].playCounter;
            found = true;
            // check if user is a returning player
            // if yes, welcome them back and prompt them to guess a number
            if (playerData[i].continue){
                playerData[i].continue = false;
                playerReturn = true;
                playerData[i].randomNum = Math.floor(Math.random() * 10) + 1;
                twiml.message("Welcome back, guess a number between 1-10 inclusively");
            }
            --i;
        }
        ++i;
    }
    // Store new user data
    if (!found){
        playerData.push({accountNum : request.body.From , randomNum : Math.floor(Math.random() * 10) + 1,
             playCounter : 0, won : false, continue : false}); //Store new player info 
        twiml.message("Hello, welcome to the high low game.");
        twiml.message("Guess a number between 1-10 inclusively");
    }

    // don't run the bottom if body statement if the player is a returning player (one time).
    if (playerReturn) found = false;

    if (found){
        var numGuess = Number(request.body.Body);
        
        if ((numGuess > randomNum) && (!playerData[i].won)){
            twiml.message("Too high"); //notify the number is too high    
        }
        else if ((numGuess < randomNum) && (!playerData[i].won)){
            twiml.message("Too low"); //notify the number is too low
        }
        else if ((numGuess == randomNum) && (!playerData[i].won)) {
            playCounter += 1;
            playerData[i].playCounter = playCounter; //Store the total number of times played
            playerData[i].won = true;
            twiml.message("You guessed the right number " + numGuess);
            twiml.message("You played " + playCounter + " time(s)");
            twiml.message("New game? Yes/No"); //prompt user for a new game        
        }
        else if ((request.body.Body.toLowerCase() == "yes") && playerData[i].won){
            randomNum = Math.floor(Math.random() * 10) + 1;
            playerData[i].randomNum = randomNum; //generate a new number
            playerData[i].won = false; // reset win status
            twiml.message("Guess the new number between 1-10 inclusively"); // prompt user for a new number       
        }
        else if ((request.body.Body.toLowerCase() == "no") && playerData[i].won){
            playerData[i].continue = true;
            playerData[i].won = false; // reset win status
            twiml.message("Thanks for playing");        
        }
        else if (playerData[i].won){
            twiml.message("Enter Yes or No"); // force user to enter yes or no when responding to New game?
        }
        else{
            twiml.message("Enter a number between 1-10 inclusively"); // prompt user to enter a numeric value
        }
    }
    response.writeHead(200, { "Content-Type" : "text/xml"});
    response.end(twiml.toString());
})

app.listen(5500);
