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

async function updateData()
{
  let updateColumn = document.getElementById('memberCategory').value;
  let updateValue = document.getElementById('updateValue').value;
  if (updateColumn == "RolePermission")
  {
    updateValue = `${updateValue}`;
  }
  let updateMember = {
    token: await authHandler.getToken(),
    Email: document.getElementById('updateMember').value,
    updateColumn: updateColumn,
    value: updateValue
  }
  console.log(updateMember);

  let postResponse = await fetch(`https://jproj.xyz/updateMember`, {
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

document.getElementById('updateMemberBtn').addEventListener('click',updateData);
document.getElementById('deleteMemberBtn').addEventListener('click',deleteMemData);