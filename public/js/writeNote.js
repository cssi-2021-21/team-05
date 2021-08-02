let googleUser = null;

window.onload = () => {
    firebase.auth().onAuthStateChanged(user => {
        if (user) {
            googleUser = user;
            console.log(googleUser);
            document.querySelector("#helloTitle").innerHTML = `Hello, ${googleUser.displayName ? googleUser.displayName : googleUser.email.split('@')[0]}!`
        } else {
            document.querySelector(".hero").innerHTML = "You are not logged in.";
        }
    });

    const start = new Date(Date.now() -  24 * 60 * 60 * 1000);
    const end   = new Date(Date.now() +  24 * 60 * 60 * 1000);

    const calendars = bulmaCalendar.attach('.bulmaCalendar');

    calendars.forEach(calendar => {

        calendar.value(start);

        calendar.on('save', function(datepicker) {
            console.log(datepicker.data.value());
        });

    });

    bulmaCalendar.attach('.bulmaCalendarRange', {
        isRange:   true,
        startDate: start,
        endDate:   end
    });

    bulmaCalendar.attach('.bulmaCalendarRangeLabels', {
        isRange:   true,
        labelFrom: 'Check-in',
        labelTo:   'Check-out'
    });

    bulmaCalendar.attach('#datepickerDemoDisabledDates', {
        displayMode:   'dialog',
        disabledDates: [start, end]
    });

    bulmaCalendar.attach('#datepickerDemoDisabledWeekDays', {
        displayMode:      'dialog',
        disabledWeekDays: '0,6'
    });

    bulmaCalendar.attach('#datepickerDemoHighlightedDates', {
        displayMode:      'dialog',
        highlightedDates: [start, end]
    });

    bulmaCalendar.attach('#datepickerDemoWeekStart', {
        displayMode: 'dialog',
        weekStart:   1
    });
}

document.querySelector("#logoutButton").addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
        window.location = "index.html";
    }).catch((error) => {
        alert(error);
    });
})

document.querySelector("#createNoteButton").addEventListener("click", () => {
    const payload = {
        title: document.querySelector("#noteTitle").value,
        text: document.querySelector("#noteText").value,
        created: new Date().getTime()
    }
    firebase.database().ref(`/users/${googleUser.uid}`).push(payload).then(() => {
        alert("Note Submitted.");
        document.querySelector("#noteTitle").value = "";
        document.querySelector("#noteText").value = "";
    }).catch(error => {
        console.log("error writing new note: ", error);
    })
});
