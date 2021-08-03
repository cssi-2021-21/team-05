let googleUser = null;

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
        created: new Date(Date.now()).toString()
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
    let cards = ``;

    console.log(data)

    for (id in data) {
        cards += createCard(data[id], id);
    }

    document.querySelector("#itemTable").innerHTML = cards;
}

const createCard = (item, itemId) => {
    return `
    <tr>
        <td>
            <div class="title is-4">
                ${item.title}
            </div>
            <div class="subtitle is-6">
                ${item.text}
            </div>
        </td>
    </tr>
    `;
}
