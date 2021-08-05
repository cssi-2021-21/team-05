let googleUser = null;
let doNotHide = false;

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
    document.getElementById('addNoteButtonText').innerHTML = document.querySelector("#addNoteButtonText").innerHTML == "+" ? "-" : "+";
    document.querySelector("#inputCard").classList.toggle("is-hidden");
}

document.querySelector("#inputCardToggle").addEventListener("click", () => toggleInputCard()); 
document.querySelector("#addNoteButton").addEventListener("click", () => toggleInputCard());

document.querySelector("#itemTitle").addEventListener("input", () => {
    document.querySelector("#submitButton").disabled = (document.querySelector("#itemTitle").value == false);
});

document.querySelector("#submitButton").addEventListener("click", () => {
    const tags = document.querySelector("#itemTags").value.split(" ");
    let payload = {
        title: document.querySelector("#itemTitle").value,
        text: document.querySelector("#itemDetails").value,
        tags: tags.filter((c, index) => {
            return tags.indexOf(c) === index
        }).filter(Boolean),
        due: selectedDate.getTime(),
        created: new Date(Date.now()).getTime(),
        complete: false
    }

    if (payload.tags.length === 0) {
        payload.tags = [''];
    }

    console.log(payload)

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
    console.log(data);
    document.querySelector("#counter").innerHTML = data ? Object.values(data).filter(item => !item.complete).length : 0; 
    document.querySelector("#completedCounter").innerHTML = (data ? Object.values(data).filter(item => item.complete).length : 0) + " Completed"; 
    document.querySelector("#itemTable").innerHTML = '';

    let sortedData = [];
    for (const id in data) {
        const item = data[id];
        sortedData.push([item, id]);
    }

    sortedData.sort((a, b) => {
        return a[0]['due'] > b[0]['due'];
    });

    let tagsSet = new Set();

    sortedData.forEach((sortedElement) => {
        document.querySelector("#itemTable").innerHTML = document.querySelector("#itemTable").innerHTML + createCard(sortedElement[0], sortedElement[1]);
        if (sortedElement[0].complete) {
            document.getElementById(`${sortedElement[1]}-checkbox`).setAttribute('checked', 'checked');
            if (!doNotHide) {
                document.getElementById(`${sortedElement[1]}`).classList.toggle("is-hidden");
            }
        }
        if (!sortedElement[0].tags[0]) {
            document.getElementById(`${sortedElement[1]}-tags`).classList.toggle("is-hidden");
            document.getElementById(`${sortedElement[1]}-span`).classList.toggle("is-hidden");
        } else {
            sortedElement[0].tags.forEach((tag) => {
                tagsSet.add(tag);
            });
        }

        let tagsArr = Array.from(tagsSet);
        tagsArr.sort();
        console.log(tagsArr)
        document.querySelector("#tagTable").innerHTML = '';
        tagsArr.forEach((tag) => {
            document.querySelector("#tagTable").innerHTML = document.querySelector("#tagTable").innerHTML + createTagCard(tag);
        });
    });
}

const editItem = (itemId, title, text) => {
    document.querySelector(`#${itemId}-title`).outerHTML = `<input id="${itemId}-title" placeholder="Title (leave blank to delete item)" class="input is-normal" type="text" value="${title}">`
    document.querySelector(`#${itemId}-text`).outerHTML = `<input id="${itemId}-text" placeholder="Details" class="textarea is-small" type="text" value="${text}">`
    let titleInput = document.querySelector(`#${itemId}-title`);
    let textInput = document.querySelector(`#${itemId}-text`);

    titleInput.addEventListener("change", () => {
        const newTitle = titleInput.value;
        if (!newTitle) firebase.database().ref(`users/${googleUser.uid}/${itemId}`).remove();
        else firebase.database().ref(`users/${googleUser.uid}/${itemId}`).update({ title: newTitle });
    });

    textInput.addEventListener("change", () => {
        firebase.database().ref(`users/${googleUser.uid}/${itemId}`).update({ text: textInput.value });
    });

    document.querySelector(`#${itemId}-tags`).classList.add("is-hidden");
    document.querySelector(`#${itemId}-span`).classList.remove("is-hidden");
    document.querySelector(`#${itemId}-tagsInput`).classList.remove("is-hidden");
    const tagsInput = document.querySelector(`#${itemId}-tagsInput`);
    tagsInput.classList.remove("is-hidden");
    tagsInput.addEventListener("change", () => {
        if (tagsInput.value === '') {
            firebase.database().ref(`users/${googleUser.uid}/${itemId}`).update({
                tags: ['']
            });
        }
        else {
            const newTags = tagsInput.value.split(" ");
            firebase.database().ref(`users/${googleUser.uid}/${itemId}`).update({
                tags: newTags.filter((c, index) => {
                    return newTags.indexOf(c) === index
                }).filter(Boolean)
            });
        }
    });
}

const createCard = (item, itemId) => {

    let tagHTML = `
        <input id="${itemId}-tagsInput" class="input is-small is-hidden" type="text" placeholder="Tags (separate with spaces)" value="${item.tags ? item.tags.join(" ") : ""}"> </input>
        <div class="tags" id="${itemId}-tags">
    `;

    for (let tag in item.tags) {
        tagHTML += `<span id="${itemId}-span" class="tag is-primary" onclick="editItem('${itemId}', '${item.title}', '${item.text}')">${item.tags[tag]}</span>`
    }

    tagHTML += '</div>'

    var date = getFormattedDate(new Date(item.due));

    return `
        <tr id="${itemId}" class="item-card">
            <td>
                <div class="columns is-variable">
                    <div class="column is-narrow">
                        <div class="field">
                            <input class="is-checkradio is-large is-rtl" id="${itemId}-checkbox" type="checkbox" onclick="toggleCompleteItem('${itemId}', ${item.complete})">
                            <label id="${itemId}-label" for="${itemId}-checkbox" style="margin-left: -10px; margin-right: -10px;"></label>
                        </div>
                    </div>
                    <div class="column has-text-left">
                        <div id="${itemId}-title" class="title is-4" onclick="editItem('${itemId}', '${item.title}', '${item.text}')">
                            ${item.title}
                        </div>
                        <div id="${itemId}-text" class="subtitle is-6" onclick="editItem('${itemId}', '${item.title}', '${item.text}')" style="margin-bottom:5px;">
                            ${item.text}
                        </div>
                        ${tagHTML}
                    </div>
                    <div class="column is-narrow has-text-right">
                        <div class="subtitle is-3">
                            ${date}
                        </div>
                    </div>
                </div>
            </td>
        </tr>
    `;
}

const createTagCard = (tag) => {
    return `
        <tr id="${tag}" class="tag-card">
            <td>
                <div class="columns is-variable">
                    <div class="column is-narrow">
                        <div class="field">
                            <input class="is-checkradio is-small is-rtl" id="${tag}-checkbox" type="checkbox">
                            <label id="${tag}-label" for="${tag}-checkbox" style="margin-left: -10px; margin-right: -10px;"></label>
                        </div>
                    </div>
                    <div class="column has-text-left">
                        <div id="${tag}-title" class="subtitle is-6">
                            ${tag}
                        </div>
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
                'status': isComplete ? 'needsAction' : 'completed',
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
        document.getElementById('showCompleteToggle').innerHTML = "Show";
    } else {
        const cards = document.getElementsByClassName("item-card");
        for (let i = 0; i < cards.length; i++) {
            let element = cards.item(i);
            element.classList.remove("is-hidden");
        }
        doNotHide = true;
        document.getElementById('showCompleteToggle').innerHTML = "Hide";
    }
});

function handleClientLoad() {
    gapi.load('client:auth2', () => gapi.client.init({
        apiKey: GAPI_API_KEY,
        clientId: GAPI_CLIENT_ID,
        discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/tasks/v1/rest"],
        scope: "https://www.googleapis.com/auth/tasks"
    }));
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

function getFormattedDate(date) {
    var year = date.getFullYear();
  
    var month = (1 + date.getMonth()).toString();
    month = month.length > 1 ? month : '0' + month;
  
    var day = date.getDate().toString();
    day = day.length > 1 ? day : '0' + day;
    
    return month + '/' + day
  }
