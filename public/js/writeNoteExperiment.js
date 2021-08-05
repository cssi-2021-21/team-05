let googleUser = null;
let doNotHide = false;
let googleCalendarCompletion = {};

window.onload = () => {
    document.querySelector("#submitButton").disabled = true;
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            googleUser = user;
            console.log(googleUser);
            getItems(googleUser.uid);

            //document.querySelector("#helloTitle").innerHTML = `Hello, ${googleUser.displayName ? googleUser.displayName : googleUser.email.split('@')[0]}!`
        } else {
            window.location = "index.html";
        }
    });
}

document.querySelector("#logoutButton").addEventListener("click", () => {
    gapi.auth2.getAuthInstance().signOut().then(firebase.auth().signOut());
});

function toggleInputCard() {
    document.querySelector("#inputCard").classList.toggle("is-hidden");
    document.querySelector("#inputCardToggle").disabled = !document.querySelector("#inputCardToggle").disabled;
}

document.querySelector("#inputCardToggle").addEventListener("click", () => toggleInputCard());
document.querySelector("#cancelButton").addEventListener("click", () => toggleInputCard());

document.querySelector("#itemTitle").addEventListener("input", () => {
    document.querySelector("#submitButton").disabled = (document.querySelector("#itemTitle").value == false);
});

document.querySelector("#submitButton").addEventListener("click", () => {
    let payload = {
        title: document.querySelector("#itemTitle").value,
        text: document.querySelector("#itemDetails").value,
        tags: document.querySelector("#itemTags").value.split(" "),
        due: selectedDate.getTime(),
        created: new Date(Date.now()).getTime(),
        complete: false
    }

    gapi.client.tasks.tasklists.list().then(res => {
        const taskListID = res.result.items[0].id;

        gapi.client.tasks.tasks.insert({
            'tasklist': taskListID,
            'resource': {
                'title': payload.title,
                'due': ISODateString(new Date(payload.due)),
                'status': payload.complete ? 'completed' : 'needsAction',
                'notes': payload.text
            }
        }).then(res => {
            console.log(res.result.id)
            payload.googleCalendarId = res.result.id;
            firebase.database().ref(`/users/${googleUser.uid}`).push(payload).then(() => {
                alert("Note Submitted.");
                document.querySelector("#itemTitle").value = "";
                document.querySelector("#itemDetails").value = "";
                document.querySelector("#itemTags").value = "";
                toggleInputCard();
            }).catch(error => {
                console.log("error writing new note: ", error);
            });
        });
    });

});

const getItems = (userId) => {
    firebase.database().ref(`/users/${userId}`).on('value', (snapshot) => { // calls it once (on page load here), then whenever the database values change
        renderDataAsHtml(snapshot.val());
    });
}

const renderDataAsHtml = (data) => {
    console.log(data)
    console.log('RRRRR', googleCalendarCompletion)
    document.querySelector("#itemTable").innerHTML = '';
    
    for (id in data) {
        console.log('XXXXXXXXXXX', data[id].googleCalendarId)
        if (data[id].complete != googleCalendarCompletion[data[id].googleCalendarId]) {
            console.log(`moving ${id} (${data[id].googleCalendarId}) from ${data[id].complete} to ${googleCalendarCompletion[data[id].googleCalendarId]}`)
            console.log('LLLLLLLL', data[id].googleCalendarId, googleCalendarCompletion, Object.keys(googleCalendarCompletion), googleCalendarCompletion[data[id].googleCalendarId])
            firebase.database().ref(`users/${googleUser.uid}/${id}`).update({
                complete: googleCalendarCompletion[data[id].googleCalendarId]
            });
        }
        document.querySelector("#itemTable").innerHTML = document.querySelector("#itemTable").innerHTML + createCard(data[id], id);
        if (data[id].complete) {
            document.getElementById(`${id}-checkbox`).setAttribute('checked', 'checked');
            if (!doNotHide) {
                document.getElementById(`${id}`).classList.toggle("is-hidden");
            }
        }
    }

}

const createCard = (item, itemId) => {

    let tagHTML = '<div class = "tags">';

    for(let tag in item.tags){
        tagHTML += `<span class="tag is-primary">${item.tags[tag]}</span>`
    }

    tagHTML += '</div>'

    return `
    <tr id="${itemId}" class="item-card">
        <td>
            <div class="columns is-variable">
                <div class="column is-narrow">
                    <div class="field">
                        <input class="is-checkradio is-large is-rtl" id="${itemId}-checkbox" type="checkbox" name="exampleCheckboxLarge" onclick="toggleCompleteItem('${itemId}', ${item.complete})">
                        <label id="${itemId}-label" for="${itemId}-checkbox" style="margin-left: -10px; margin-right: -10px;"></label>
                    </div>
                </div>
                <div class="column has-text-left">
                    <div class="title is-4">
                        ${item.title}
                    </div>
                    <div class="subtitle is-6">
                        ${item.text}
                    </div>

                    ${tagHTML}
                </div>
            </div>
        </td>
    </tr>
    `;
}

const toggleCompleteItem = (itemId, isComplete) => {
    ref = firebase.database().ref(`users/${googleUser.uid}/${itemId}`);
    ref.update({
        complete: !isComplete
    });
    let googleCalendarId = null;
    ref.on('value', (snapshot) => {
        googleCalendarId = snapshot.val().googleCalendarId;
    });
    gapi.client.tasks.tasklists.list().then(res => {
        const taskListID = res.result.items[0].id;
        
        gapi.client.tasks.tasks.patch({
            'tasklist': taskListID,
            "task": googleCalendarId,
            'resource': {
                'status': isComplete ?  'needsAction' : 'completed',
            }
        }).then(res => console.log('RRRR', res));
    });
    if (isComplete) {
        document.getElementById(`${itemId}-checkbox`).removeAttribute('checked');
    } else {
        document.getElementById(`${itemId}-checkbox`).setAttribute('checked', 'checked');
    }
}

document.querySelector("#showCompleteToggle").addEventListener("click", () => {
    if (doNotHide) {
        const cards = document.getElementsByClassName("item-card");
        for (let i = 0; i < cards.length; i++) {
            let element = cards.item(i);
            console.log(`${element.getAttribute('id')}-checkbox`)
            let checkbox = document.getElementById(`${element.getAttribute('id')}-checkbox`);
            if (checkbox.hasAttribute("checked")) {
                element.classList.add("is-hidden");
            }
        }
        doNotHide = false;
        document.getElementById('showCompleteToggle').innerHTML = "Show completed";
    } else {
        const cards = document.getElementsByClassName("item-card");
        for (let i = 0; i < cards.length; i++) {
            let element = cards.item(i);
            element.classList.remove("is-hidden");
        }
        doNotHide = true;
        document.getElementById('showCompleteToggle').innerHTML = "Hide completed";
    }
});

let handleClientLoad = () => {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            apiKey: GAPI_API_KEY,
            clientId: GAPI_CLIENT_ID,
            discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest"],
            scope: "https://www.googleapis.com/auth/tasks"
        }).then(() => {
            gapi.client.tasks.tasklists.list().then(res => {
                const taskListID = res.result.items[0].id;
                gapi.client.tasks.tasks.list({
                    'tasklist': taskListID
                }).then(response => {
                    response.result.items.forEach(item => {
                        googleCalendarCompletion[item.id] = item.status == 'completed'
                    });
                });
            });
        });
    });
}

function ISODateString(d) {
    function pad(n) {
        return n < 10 ? '0' + n : n
    }
    return d.getUTCFullYear() + '-' +
        pad(d.getUTCMonth() + 1) + '-' +
        pad(d.getUTCDate()) + 'T' +
        pad(d.getUTCHours()) + ':' +
        pad(d.getUTCMinutes()) + ':' +
        pad(d.getUTCSeconds()) + 'Z'
}
