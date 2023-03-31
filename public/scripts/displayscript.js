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


async function tempUpdate(tempObj)
{
  tempObj.token = await authHandler.getToken();
  let postResponse = await fetch(`https://jproj.xyz/updateProduct`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(tempObj)
  }).then((res) => res.json());

  console.log(postResponse);
  displayProducts()
}

async function tempDelete(tempObj)
{
  tempObj.token = await authHandler.getToken();
  let postResponse = await fetch(`https://jproj.xyz/deleteProduct`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(tempObj)
  }).then((res) => res.json());

  console.log(postResponse);
}


async function updateUser(userObj)
{
  userObj.token = await authHandler.getToken();
  let postResponse = await fetch(`https://jproj.xyz/updateMember`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(userObj)
  }).then((res) => res.json());

  console.log(postResponse);
  displayMembers();
}

async function deleteUser(userObj)
{
  console.log(userObj);
  // userObj.token = await authHandler.getToken();
  // let postResponse = await fetch(`https://jproj.xyz/deleteProduct`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-type': 'application/json'
  //   },
  //   body: JSON.stringify(userObj)
  // }).then((res) => res.json());
  //
  // console.log(postResponse);
}

//insert params to url then display content based on it

function nav() {
}

//pos
async function initialisePos() {

  let Category = document.getElementById("Category");

	createProductsButtons(Category.value);

  Category.addEventListener("change", function() {
    createProductsButtons(Category.value);
  })

	//receipt number

	//cash / eftpos
  	let payment_buttons = document.getElementsByClassName("payment_method");
	for (let i = 0; i < payment_buttons.length; i++) {
		payment_buttons[i].addEventListener('click', function() {finaliseReceipt()});
	}

}

async function createProductsButtons(category) {
  let reportContainer = new JTML('#products_list').html('');
  const products_listCont = document.getElementById("products_list");

  let sendObject = {
    token: await authHandler.getToken(),
    category: category
  }

  let postResponse = await fetch(`https://jproj.xyz/products_list`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(sendObject)
    })
  .then((res) => res.json());


  postResponse.forEach(article => products_listCont.insertAdjacentHTML("beforeend", '<button class="products" id="' + article.ProductID + '">' + article.Name + '</button>'));

  //products
  let products_buttons = document.getElementsByClassName("products");

  for (let i = 0; i < products_buttons.length; i++) {
    products_buttons[i].addEventListener('click', function() {addToReceipt(products_buttons[i].id, products_buttons[i].innerHTML)});
  }
}

async function addToReceipt(id, name) {

  //check if product has been added before
  let productExisted = false;
  let receipt_products = document.getElementsByClassName("receipt_product");
  let receipt_quantities = document.getElementsByClassName("receipt_quantity");

  for (let i = 0; i < receipt_products.length; i++) {
    if (receipt_products[i].innerHTML == name) {
      //product existed
      productExisted = true;

      //add to receipt
      let num = parseInt(receipt_quantities[i].innerHTML) + 1;
      receipt_quantities[i].innerHTML = num.toString();

    }
  }

  if (!productExisted) {

      //add to receipt
      document.getElementById("receipt_content").insertAdjacentHTML("beforeend", '<tr><td class="receipt_quantity">1</td><td class="receipt_product">' + name + '</td><td hidden class="product_id">' + id + '</td></tr>');
  }

  //add to total
  updateTotal(id);
}

async function updateTotal(productID) {

  //total
  let receipt_total = parseInt(document.getElementById("total").innerHTML);
  let unitPrice = 0;

  //get price
  let addedProduct = {
    token: await authHandler.getToken(),
    productID : productID
  }

  let postResponse = await fetch(`https://jproj.xyz/getPrice`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(addedProduct)
    }).then((res) => res.json());

  unitPrice = parseInt(postResponse);

  receipt_total += unitPrice;

  console.log(receipt_total);

  //update html
  document.getElementById("total").innerHTML = receipt_total;

}

async function finaliseReceipt() {
	//sales

  // array of food items (their id), and their quantity
  let receipt_products = document.getElementsByClassName("product_id");
  let receipt_quantities = document.getElementsByClassName("receipt_quantity");
  let productItems = [];

  console.log(receipt_products);

  Array.from(receipt_products).forEach((singleReceiptProduct, i)=>{
    productItems[i] = {
      ProductID: receipt_products[i].innerHTML,
      Quantity: receipt_quantities[i].innerHTML
    }
  })
  console.log(productItems);

  // send this to server
  let postResponse = await fetch(`https://jproj.xyz/proccessSales`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      token: await authHandler.getToken(),
      products: productItems
    })
  }).then((res) => res.json());

  console.log(postResponse);

  // alert the user if the sale was successful or unsuccessful
  if (!isNaN(+postResponse)) {
    alert('sale was successful');
    // clear the page if successful
    document.getElementById("customer").value = "";
    document.getElementById("receipt_content").innerHTML = "";
    document.getElementById("total").innerHTML = "0";
  } else {
    alert('sale was NOT successful');
  }  
}

async function displayProducts() {
	// const productCollection = document.getElementById("displayProducts");
	await fetch('https://jproj.xyz/displayProducts')
		.then((res) => res.json())
		.then((productData) => {

      productData.forEach((singleProduct)=>{
        if (singleProduct.LastUpdated) {
          singleProduct.LastUpdated = new Date(singleProduct.LastUpdated).toDateString();
        }

      })

      new JTML('#displayProducts').html('')
      let editTable = new Table(productData,'#displayProducts',{
  			allowEditing: true,
  			allowDeleting: true
		  });
      editTable.on('update',tempUpdate)
      editTable.on('delete',tempDelete)
    });
}

async function displayMembers() {
	// const Memberlist = document.getElementById("displayMembers");

  let members = await fetch(`https://jproj.xyz/displayMembers`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify({
      token: await authHandler.getToken()
    })
    }).then((res) => res.json());

    members.forEach((singleMember)=>{
      if (singleMember.DOB) {
        singleMember.DOB = new Date(singleMember.DOB).toDateString();
      }
      if (singleMember.LastUpdated) {
        singleMember.LastUpdated = new Date(singleMember.LastUpdated).toDateString();
      }

    })

  let memberTable = new Table(members,'#displayMembers',{
    allowDeleting: true,
    allowEditing: true
  })

  memberTable.on('update',updateUser)
  memberTable.on('delete',deleteUser)

	// await fetch('https://jproj.xyz/displayMembers')
	// 	.then((res) => res.json())
	// 	.then(
	// 		data => {
  //       data.forEach(article => Memberlist.insertAdjacentHTML("beforeend",`<tr><td>${article.Name}</td><td>${article.DOB}</td><td>${article.Email}</td><td>${article.MobileNo}</td>`))
	// 		});
}

//manage products
function initialiseManageProducts() {
	//const products_listCont = document.getElementById("table_content");


}

//initialise
async function init() {
	let productInputs = document.getElementById("productInputs");
  let updateProductFrom = document.getElementById("updateProductFrom");
  let deleteProductFrom = document.getElementById("deleteProductFrom");
  let productTable = document.getElementById("productTable");
  let deleteMemberFrom = document.getElementById("deleteMemberFrom");
  let updateMemberFrom = document.getElementById("updateMemberFrom");

	nav();
	// displayProducts();
	if (window.location.href == "https://jproj.xyz/pos") {
		//check permission first
		initialisePos();
	}
	else if (window.location.href == "https://jproj.xyz/manage-products") {
		// initialiseManageProducts()
		displayProducts();
    document.getElementById("productAddBtn").addEventListener('click', function () { show(1)});
    document.getElementById("productCancelBtn").addEventListener('click', function () { hide(productInputs)});
	}
  else if (window.location.href == "https://jproj.xyz/manage-members"){
    displayMembers();

	document.getElementById("memberEditBtn").addEventListener('click', function () { showmember(1)});
    document.getElementById("cancelUpdateBtn").addEventListener('click', function () { hidemember(updateMemberFrom)});

	document.getElementById("memberDeleteBtn").addEventListener('click', function () { showmember(2)});
    document.getElementById("cancelMemDeleteBtn").addEventListener('click', function () { hidemember(deleteMemberFrom)});
  }

  authHandler.onceLoggedIn(async ()=>{
    let roles = await fetch(`https://jproj.xyz/getCurrentUserRoles`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        token: await authHandler.getToken()
      })
      }).then((res) => res.json());

    let isManager = false;
    roles.forEach((singleRole)=>{
      if (singleRole.RoleName == "StoreManager" || singleRole.RoleName == "OfficeAdmin") {
        isManager = true;
      }
    })
    if (!isManager) {
      console.log('you are not a manager');
      // let managementElements = [
      //   document.querySelector('a[href$="pos"]'),
      //   document.querySelector('a[href$="manage-members"]'),
      //   document.querySelector('a[href$="manage-products"]'),
      //   document.querySelector('a[href$="reports"]'),
      // ];
      // managementElements.forEach((managementElement)=>{
      //   managementElement.style.display = 'none';
      // })
      window.location.href = 'https://jproj.xyz/members-page';

    } else {
      console.log('you are a manager');
    }

    console.log(roles);
  })
}

function hide(name)
{
	name.style.display = 'none';
  productTable.style.display = "block";
}

function show(page)
{
  if(page == 1)
  {
    productInputs.style.display = "block";
  }
  else if(page == 2)
  {
    productInputs.style.display = "none";
  }
}

function hidemember(name)
{
	name.style.display = 'none';
//   productTable.style.display = "block";
}

function showmember(page)
{
  if(page == 1)
  {
    updateMemberFrom.style.display = "block";
	deleteMemberFrom.style.display = "none";
  }
  else if(page == 2)
  {
    updateMemberFrom.style.display = "none";
    deleteMemberFrom.style.display = "block";
  }
//   else if(page == 3)
//   {
//     deleteProductFrom.style.display = "block";
//     productInputs.style.display = "none";
//     updateProductFrom.style.display = "none";
//     productTable.style.display = "none";
  }



window.onload = init;
