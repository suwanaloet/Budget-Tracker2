// create variable to hold db connection
let db;
// establish a connection to IndexedDB database called 'budget-tracker' and set it to version 1
const request = indexedDB.open('budget-tracker', 1);

// this event will emit if the database version changes (nonexistant to version 1, v1 to v2, etc.)
request.onupgradeneeded = function (event) {
    // save a reference to the database 
    const db = event.target.result;
    // create an object store (table) called `new_entry`, set it to have an auto incrementing primary key of sorts 
    db.createObjectStore('new_entry', { autoIncrement: true });
};

// upon a successful 
request.onsuccess = function (event) {
    // when db is successfully created with its object store (from onupgradedneeded event above) or simply established a connection, save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run uploadPizza() function to send all local db data to api
    if (navigator.onLine) {
        // we haven't created this yet, but we will soon, so let's comment it out for now
         uploadEntry();
    }
};


request.onerror = function(event) {
    //log error here
    console.log(event.target.errorCode);
}

function saveRecord(record) {
    // open a new transaction with the database with read and write permissions 
    const transaction = db.transaction(['new_entry'], 'readwrite');

    // access the object store for `new_pizza`
    const entryObjectStore = transaction.objectStore('new_entry');

    // add record to your store with add method
    entryObjectStore.add(record);
}

function uploadEntry() {
    // open a transaction on your db
    const transaction = db.transaction(['new_entry'], 'readwrite');

    // access your object store
    const entryObjectStore = transaction.objectStore('new_entry');

    // get all records from store and set to a variable
    const getAll = entryObjectStore.getAll();

    // upon a successful .getAll() execution, run this function
    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    // open one more transaction
                    const transaction = db.transaction(['new_entry'], 'readwrite');
                    // access the new_pizza object store
                    const entryObjectStore = transaction.objectStore('new_entry');
                    // clear all items in your store
                    entryObjectStore.clear();

                    alert('All saved entries have been submitted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', uploadEntry);