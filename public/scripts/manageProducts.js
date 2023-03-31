import { AuthHandler } from 'https://joshprojects.site/AuthHandler.js';

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

async function returnData()
{
  let newProduct = {
    token: await authHandler.getToken(),
    name: document.getElementById('productName').value,
    quantityOnHand: document.getElementById('quantityOnHand').value,
    unitPrice: document.getElementById('unitPrice').value,
    productCategory: document.getElementById('productCategory').value

  }
  console.log(newProduct);

  let postResponse = await fetch(`https://jproj.xyz/addNewProduct`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(newProduct)
  }).then((res) => res.json());

  console.log(postResponse);
}


async function updateData()
{
  let updateColumn = document.getElementById('updateCategory').value;
  let updateValue = document.getElementById('updateValue').value;
  if (updateColumn == "Name")
  {
    updateValue = `'${updateValue}'`;
  }
  let updateProduct = {
    token: await authHandler.getToken(),
    productID: document.getElementById('updateProductID').value,
    updateColumn: updateColumn,
    value: updateValue
  }
  console.log(updateProduct);

  // let postResponse = await fetch(`https://jproj.xyz/updateProduct`, {
  //   method: 'POST',
  //   headers: {
  //     'Content-type': 'application/json'
  //   },
  //   body: JSON.stringify(updateProduct)
  // }).then((res) => res.json());
  //
  // console.log(postResponse);
}

async function deleteData()
{
  let deleteProduct = {
    token: await authHandler.getToken(),
    productID: document.getElementById('deleteProductID').value,
  }
  console.log(deleteProduct);

  let postResponse = await fetch(`https://jproj.xyz/deleteProduct`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(deleteProduct)
  }).then((res) => res.json());

  console.log(postResponse);
}

document.getElementById('saveProductBtn').addEventListener('click',returnData);
