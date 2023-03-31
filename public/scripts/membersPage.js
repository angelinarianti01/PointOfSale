import { AuthHandler } from 'https://joshprojects.site/AuthHandler.js';

import { Table } from 'https://jproj.xyz/modules/Table.js';

import { JTML } from "https://joshprojects.site/JTML_Module.js";


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
let authHandler = new AuthHandler(firebaseConfig);//general



async function init()
{
  getMemberSales();
  welcomeNote();
}


async function getMemberSales()
{
  let token = {
    token: await authHandler.getToken()
  }

  let postResponse = await fetch(`https://jproj.xyz/getMemberSales`, {
		method: 'POST',
		headers: {
		  'Content-type': 'application/json'
		},
		body: JSON.stringify(token)
		})
	.then((res) => res.json());
  console.log(postResponse);
	//postResponse.forEach(article => console.log(article.SalesID));

  let memberSalesTable = new JTML('#memberSalesTable').html('');
  let reportTable = new Table(postResponse,'#memberSalesTable')
}


async function welcomeNote()
{
  let token = {
    token: await authHandler.getToken()
  }

  let postResponse = await fetch(`https://jproj.xyz/welcomeNote`, {
		method: 'POST',
		headers: {
		  'Content-type': 'application/json'
		},
		body: JSON.stringify(token)
		})
	.then((res) => res.json());
  //console.log(postResponse);
  postResponse.forEach(article => document.getElementById("welcomeNote").innerHTML = `Welcome ${article.Name},`);
}






window.onload = init;
