import { JTML } from "https://joshprojects.site/JTML_Module.js";

// Josh's library that acts as a wrapper around Firebase Authentication making it simpler to use
import { AuthHandler } from 'https://joshprojects.site/AuthHandler.js';

import { Table } from 'https://jproj.xyz/modules/Table.js';


"use strict";

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);
  
    element.style.display = 'none';
    document.body.appendChild(element);
  
    element.click();
  
    document.body.removeChild(element);
}

// details provided by Firebase that need to be provided to AuthHandler in order for it to validate our requests
const firebaseConfig = {
    apiKey: "AIzaSyCUKo1VYGnLRmC2Bl1-MB5oXyySTcMOdKE",
    authDomain: "gotogro-bc075.firebaseapp.com",
    projectId: "gotogro-bc075",
    storageBucket: "gotogro-bc075.appspot.com",
    messagingSenderId: "1083964865339",
    appId: "1:1083964865339:web:5b04516d7d6b096fae151e"
};

let authHandler = new AuthHandler(firebaseConfig);

let dateRangeForm = new JTML('#dateRange')
dateRangeForm.on('submit',async (e)=>{
    e.preventDefault();

    let dates = {
        token: await authHandler.getToken(),
        startDate: dateRangeForm.ref.startdate.value,
        endDate: dateRangeForm.ref.enddate.value
    }

    console.log(dates);

    let bestSellingProducts = await fetch(`https://jproj.xyz/bestSellingProducts`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
    body: JSON.stringify(dates)
  }).then((res) => res.json());

  let reportContainer = new JTML('#reportContainer').html('');

  let reportTable = new Table(bestSellingProducts,'#reportContainer')
  
//   console.log(reportTable.getHea)
  bestSellingProducts.unshift({})
  reportTable.getHeadings().forEach((singleHeading)=>{
      bestSellingProducts[0][singleHeading] = singleHeading
  })
  

  var csv = bestSellingProducts.map(function(d){
    return JSON.stringify(Object.values(d));
    })
    .join('\n') 
    .replace(/(^\[)|(\]$)/mg, '');
    
    console.log(csv);

    let csvTexarea = new JTML('#csvTexarea').html(csv);

    let copyButton = new JTML('#copyButton')
        .on('click',()=>{
            navigator.clipboard.writeText(csv);
        })

    let downloadButton = new JTML('#downloadButton')
        .on('click',()=>{
            download('report.csv',csv)
        })
    

  console.log(bestSellingProducts);
})