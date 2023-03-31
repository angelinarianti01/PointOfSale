

async function toRunOnClick() {
    let varName = "something else";
    console.log('database' + varName + 'end of line');
    console.log(`database ${varName} end of line`)
    

    let dataToSend = {
        hi: "hello"
    }

    let postResponse = await fetch(`https://jproj.xyz/databaseTest`, {
			method: 'POST',
			headers: {
				'Content-type': 'application/json'
			},
			body: JSON.stringify(dataToSend)
		}).then((res) => res.json());

    console.log(postResponse);
    console.log(postResponse.sql)
}
let buttonToRunScript = document.querySelector('#script');

buttonToRunScript.addEventListener('click',toRunOnClick)

// let variables = document.querySelectorAll('')


// button  {
//     background-color: red;
// }

// #script  {
//     background-color: red;
// }

// button#script  {
//     background-color: red;
// }

// body *  {
//     background-color: red;
// }

// body > *  {
//     background-color: red;
// }