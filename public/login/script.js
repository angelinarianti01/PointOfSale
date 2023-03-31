// Josh's library that acts as a wrapper around Firebase Authentication making it simpler to use
import { AuthHandler } from 'https://joshprojects.site/AuthHandler.js';

"use strict";

async function init() {
	// details provided by Firebase that need to be provided to AuthHandler in order for it to validate our requests
	const firebaseConfig = {
		apiKey: "AIzaSyCUKo1VYGnLRmC2Bl1-MB5oXyySTcMOdKE",
		authDomain: "gotogro-bc075.firebaseapp.com",
		projectId: "gotogro-bc075",
		storageBucket: "gotogro-bc075.appspot.com",
		messagingSenderId: "1083964865339",
		appId: "1:1083964865339:web:5b04516d7d6b096fae151e"
	};

	// the first parameter must be provided
	// the second parameter is optional and if provided is a CSS selector of the element you want to create a login form into
	// the third parameter is optional and if provided is an array of valid login types (in our context will always be email and google)
	let authHandler = new AuthHandler(firebaseConfig,'#signInContainer',['email','google']);

	// onceLoggedIn is triggered when the user has logged in
	authHandler.onceLoggedIn(async ()=>{

		// tokens are used to validate the user on the server and must be sent with every request
		let token = await authHandler.getToken();
		
		// prepare the data to be sent to the server
		let dataToSend = {
			token: token
		};

		// send the data as a POST request to the specified endpoint (https://jproj.xyz/loginEndpoint) 
		// and capture the response in postResults
		let postResponse = await fetch(`https://jproj.xyz/loginEndpoint`, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json'
			},
			body: JSON.stringify(dataToSend)
		}).then((res) => res.json());

		// log the response from the server to the console
		console.log("the result from the server is:")
		console.log(postResponse);
	})

	// get a reference to a button in the DOM
	let logoutButton = document.querySelector('#logoutButton')
	// when the button is clicked...
	logoutButton.addEventListener('click',()=>{
		// log the user out
		authHandler.logout();
	})
}

document.addEventListener("DOMContentLoaded", init);