let db;

const request = indexedDB.open('budget-tracker', 1);
const TABLE_NAME = "pending-transaction";

request.onupgradeneeded = function (event) {
    db = event.target.result;

    db.createObjectStore(TABLE_NAME, { autoIncrement: true });
};


request.onsuccess = function (event) {
    db = event.target.result;

    console.log("onsuccess", db);

    if (navigator.onLine) {
        uploadPendingTransaction();
    }
};

request.onerror = function (event) {
    console.log(event.target.error);
};

function saveRecord(record) {
    const transaction = db.transaction(TABLE_NAME, 'readwrite');
    const store = transaction.objectStore(TABLE_NAME);
    store.add(record);
}

function getPendingTransactions() {
    const dbInstance = new Promise((resolve, reject) => {
        const transaction = db.transaction(TABLE_NAME, 'readwrite');
        const store = transaction.objectStore(TABLE_NAME);
        const getAll = store.getAll();


        getAll.onsuccess = async function () {
            resolve(getAll.result);
        }
    });

    return dbInstance;
}

function uploadPendingTransaction() {
    console.log("uploadPendingTransaction");

    const transaction = db.transaction(TABLE_NAME, 'readwrite');
    const store = transaction.objectStore(TABLE_NAME);
    const getAll = store.getAll();

    getAll.onsuccess = async function () {
        if (getAll.result.length > 0) {
            try {
                const res = await fetch('/api/transaction/bulk', {
                    method: 'POST',
                    body: JSON.stringify(getAll.result),
                    headers: {
                        Accept: 'application/json, text/plain, */*',
                        'Content-Type': 'application/json'
                    }
                });
                const json = await res.json();

                console.log("bulk", json);


                const transaction1 = db.transaction(TABLE_NAME, 'readwrite');
                const store1 = transaction1.objectStore(TABLE_NAME);
                store1.clear();
            } catch (e) {
                console.log(e);
            }

        }
    }
}

// window.addEventListener('online', uploadPendingTransaction);