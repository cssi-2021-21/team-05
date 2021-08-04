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
            document.querySelector(".hero").innerHTML = "You are not logged in.";
        }
    });
}

document.querySelector("#logoutButton").addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
        window.location = "index.html";
    }).catch((error) => {
        alert(error);
    });
});

function toggleInputCard() {
    document.querySelector("#inputCard").classList.toggle("is-hidden");
    document.querySelector("#inputCardToggle").classList.toggle("is-hidden");
}

document.querySelector("#inputCardToggle").addEventListener("click", () => toggleInputCard());
document.querySelector("#cancelButton").addEventListener("click", () => toggleInputCard());

document.querySelector("#itemTitle").addEventListener("input", () => {
    document.querySelector("#submitButton").disabled = (document.querySelector("#itemTitle").value == false);
});

document.querySelector("#submitButton").addEventListener("click", () => {
    const payload = {
        title: document.querySelector("#itemTitle").value,
        text: document.querySelector("#itemDetails").value,
        tags: document.querySelector("#itemTags").value.split(" "),
        due: selectedDate.toString(),
        created: new Date(Date.now()).toString(),
        complete: false
    }

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

const getItems = (userId) => {
    firebase.database().ref(`/users/${userId}`).on('value', (snapshot) => {  // calls it once (on page load here), then whenever the database values change
        renderDataAsHtml(snapshot.val());
    });
}

const renderDataAsHtml = (data) => {
    console.log(data)
    document.querySelector("#itemTable").innerHTML = '';

    for (id in data) {
        document.querySelector("#itemTable").innerHTML = document.querySelector("#itemTable").innerHTML + createCard(data[id], id);
        if (data[id].complete) {
            document.getElementById(`${id}-checkbox`).setAttribute('checked', 'checked');
            if (!doNotHide) {
                document.getElementById(`${id}-card`).classList.toggle("is-hidden");
            }
        }
    }
    
}

const createCard = (item, itemId) => {
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
                </div>
            </div>
        </td>
    </tr>
    `;
}

const toggleCompleteItem = (itemId, isComplete) => {
    firebase.database().ref(`users/${googleUser.uid}/${itemId}`).update({complete: !isComplete});
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
