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
let authHandler = new AuthHandler(firebaseConfig);

async function updateData()
{
  let updateColumn = document.getElementById('salesCategory').value;
  let updateValue = document.getElementById('updateValue').value;
  let updateSales = {
    token: await authHandler.getToken(),
    SalesID: document.getElementById('updateSalesID').value,
    updateColumn: updateColumn,
    value: updateValue
  }
  console.log(updateSales);

  let postResponse = await fetch(`https://jproj.xyz/updateSales`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(updateMember)
  }).then((res) => res.json());

  console.log(postResponse);
}

async function deleteMemData()
{
  let deleteMember = {
    token: await authHandler.getToken(),
    Email: document.getElementById('deleteMember').value,
  }
  console.log(deleteMember);

  let postResponse = await fetch(`https://jproj.xyz/deleteMember`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(deleteMember)
  }).then((res) => res.json());

  console.log(postResponse);
}


//initialise
async function init() {
  let deleteSalesID = document.getElementById("deleteMemberFrom");
  let updateSalesID = document.getElementById("updateSalesID");
  let viewBySalesID = document.getElementById("viewBySalesID");

  displayProductSales();  
  document.getElementById('filterBySalesId').addEventListener('click',function() {

    console.log(document.getElementById("salesID").value);
    displayProductSalesByID(document.getElementById("salesID").value);
  });
}

async function displayProductSales() {
  // const Memberlist = document.getElementById("displayMembers");  

  let sales = await fetch(`https://jproj.xyz/displayProductSales`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      token: await authHandler.getToken()
    })
    }).then((res) => res.json());

    sales.forEach((sale)=>{
      if (sale.LastUpdated) {
        sale.LastUpdated = new Date(sale.LastUpdated).toDateString();
      }

    })

  let salesTable = new Table(sales,'#displaySales',{
    allowDeleting: true,
    allowEditing: true
  })

  salesTable.on('update',updateSale)
  salesTable.on('delete',deleteSale)
}

async function displayProductSalesByID(salesID) {
  // const Memberlist = document.getElementById("displayMembers");
  let reportContainer = new JTML('#displaySales').html('');

  let sales = await fetch(`https://jproj.xyz/displayProductSalesByID`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      token: await authHandler.getToken(),
      salesID: salesID
    })
    }).then((res) => res.json());

    console.log(sales);

    if (sales.length == 0) {
      alert('sales id not found');
    }
    else {
      let salesTable = new Table(sales,'#displaySales',{
        allowDeleting: true,
        allowEditing: true
      })

      salesTable.on('update',updateSale)
      salesTable.on('delete',deleteSale)
    }  
}

async function updateSale(saleObj)
{
  saleObj.token = await authHandler.getToken();
  let postResponse = await fetch(`https://jproj.xyz/updateSale`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(saleObj)
  }).then((res) => res.json());

  console.log(postResponse);
  displaySales();
}

async function deleteSale(saleObj)
{
  console.log(saleObj);
  saleObj.token = await authHandler.getToken();
  let postResponse = await fetch(`https://jproj.xyz/deleteSale`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(saleObj)
  }).then((res) => res.json());
  
  console.log(postResponse);
}

window.onload = init;