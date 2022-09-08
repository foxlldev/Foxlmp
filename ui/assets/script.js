let { remote } = require('electron');
let jsmt = require('jsmediatags');
let dialog = remote.dialog;
let mainWindow = remote.getCurrentWindow();

let gaudio = null;

let selectFileButton = document.getElementById('selectFileButton');
let playButton = document.getElementById('playButton');
let setVolButton = document.getElementById('setVolButton');
let loopToggle = document.getElementById('loopButton').children[0];

var latestvolume = 1;

let queue = [];
let queuePos = 0;

let dragging = false;

function toggleLoop() {
    // repeat song > repeat list
    if (loopToggle.classList.contains('fa-repeat')) {
        window.localStorage.setItem('loop', 'repeatlist');
        loopToggle.classList.replace('fa-repeat', 'fa-arrow-down-short-wide');
    }
    // repeat list > stop
    else if (loopToggle.classList.contains('fa-arrow-down-short-wide')) {
        window.localStorage.setItem('loop', 'stop');
        loopToggle.classList.replace('fa-arrow-down-short-wide', 'fa-stopwatch');
    }
    // stop after song > repeat song
    else if (loopToggle.classList.contains('fa-stopwatch')) {
        window.localStorage.setItem('loop', 'repeatsong');
        loopToggle.classList.replace('fa-stopwatch', 'fa-repeat');
    } else {
        console.log("error");
    }
}

function loadPage() {
    setVolumeTo(window.localStorage.getItem('volume'));
}

function loadLoop() {
    loopToggle.classList.remove('fa-repeat');
    loopToggle.classList.remove('fa-arrow-down-short-wide');
    loopToggle.classList.remove('fa-stopwatch');

    if (window.localStorage.getItem('loop') === 'repeatsong') loopToggle.classList.add('fa-repeat');
    else if (window.localStorage.getItem('loop') === 'repeatlist') loopToggle.classList.add('fa-arrow-down-short-wide');
    else if (window.localStorage.getItem('loop') === 'stop') loopToggle.classList.add('fa-stopwatch');
    else console.log("error");
}

function updateTime() {
    let current = new Date(null);
    current.setSeconds(gaudio.currentTime);
    let duration = new Date(null);
    duration.setSeconds(gaudio.duration);
    document.getElementById('point-current').innerText = current.toISOString().substring(19,14);
    document.getElementById('point-duration').innerText = duration.toISOString().substring(19,14);

    if (dragging === false) {
        document.getElementById('point-slider').max = gaudio.duration;
        document.getElementById('point-slider').value = gaudio.currentTime;
    }

    if (current >= duration) {
        if (loopToggle.classList.contains('fa-repeat')) {
            gaudio.play();
        } else if (loopToggle.classList.contains('fa-arrow-down-short-wide') && queue.length > 0) {
            gaudio = queue[queuePos+1].audio;
            loadDetails(queue[queuePos+1].fpz);
            console.log("done apparently")
            loadDetails(queue[queuePos+1].fpz);
            gaudio.play();
            let newQueue = [];
            for (let i = 0; i < queue.length; i++) {
                if ((queuePos+1) <= i) newQueue.push(queue[i]);
            }
            queue = newQueue;
            queuePos = queue.indexOf(gaudio);
        }
        updateQueueWindow();
    }
}

function setProgress() {
    let slider = document.getElementById('point-slider');

    gaudio.currentTime = slider.value;
}

function setVolume() {
    setVolumeTo(document.getElementById('volume-slider').value);
}
function setVolumeTo(val) {
    document.getElementById('volume-slider').value = val;
    document.getElementById('volume-label').innerText = val+"%";
    if (gaudio !== null) gaudio.volume = val/100;
    window.localStorage.setItem('volume', val);
}

playButton.onclick = async () => {
    if (gaudio != null) {
        if (gaudio.paused){gaudio.play();playButton.innerHTML="<i class='fa-solid fa-pause'></i>";}
        else if (!gaudio.paused){gaudio.pause();playButton.innerHTML="<i class='fa-solid fa-play'></i>";}
    }
}

async function getDetails(fpz, callback) {
    jsmt.read(fpz, {
        onSuccess: (tag) => {
            callback(tag);
        },
        onError: (error) => {
            console.log(error);
        }
    });
}

async function loadDetails(fpz) {
    jsmt.read(fpz, {
        onSuccess: (tag) => {
            var image = tag.tags.picture;
            if (image) {
                var base64String = "";
                for (var i = 0; i < image.data.length; i++) {
                    base64String += String.fromCharCode(image.data[i]);
                }
                var base64 = "data:" + image.format + ";base64," + window.btoa(base64String);
                document.getElementById('picture').setAttribute('src', base64);
            } else {
                document.getElementById('picture').setAttribute('src', "./assets/albumplaceholder.png");
                console.log("no image lolol");
            }
            document.getElementById('details').style.display = "flex";
            if (window.localStorage.getItem('loop') == "true") loopToggle.checked = "checked";
            document.getElementById('selectFileButton').style.display = "none";
            // Filename
            try {var fn = fpz.split(/(\\|\/)/g).pop(); } catch(err) {console.log(err);}
            console.log("file name: "+fn);
            document.getElementById('into-filename').innerText = fn.toUpperCase();
            // Artist - Title
            let intotitle = document.getElementById('into-title');
            let title = tag.tags.title !== undefined ? tag.tags.title : "Unknown";
            let artist = tag.tags.artist !== undefined ? tag.tags.artist : "Unknown";
            intotitle.innerText = artist + " - " + title;
            // Album
            let intoalbum = document.getElementById('into-album');
            let album = tag.tags.album  !== undefined ? tag.tags.album : "Unknown album";
            intoalbum.innerText = album;

            console.log(tag);
        },
        onError: (error) => {
            console.log(error);
        }
    });
}

async function getFileAndPlay() {
    let file = await dialog.showOpenDialog(mainWindow, {
        filters: [
            {
                name: 'Music files',
                extensions: ['mp3', 'wav']
            }
        ]
    });

    if (file !== undefined && file !== null && file.canceled === false) {
        let audio = new Audio(file.filePaths[0]);
        let fpz = file.filePaths[0];
        console.log(audio);
        queue.push({audio, fpz});
        if (gaudio !== null) { openQueueWindow(); return; }
        console.log(gaudio)
        gaudio = audio;
        gaudio.play();
        console.log(gaudio)

        setVolume();

        console.log(document.getElementsByClassName('onlyPlayingButtons'))
        for (var i = 0; i < document.getElementsByClassName('onlyPlayingButtons').length; i++) {
            document.getElementsByClassName('onlyPlayingButtons')[i].style.display = "grid";
        }
        loadLoop();
        playButton.innerHTML = "<i class='fa-solid fa-pause'></i>";

        //document.getElementById('timelbl').innerText = "0:00";
        document.getElementById('point-slider').max = gaudio.duration;
        setInterval(updateTime, 1000);

        try {var fn = file.filePaths[0].split(/(\\|\/)/g).pop(); } catch(err) {console.log(err);}

        loadDetails(fpz);
    }
}

function openQueueWindow() {
    let queueWrapper = document.getElementById('queue');
    queueWrapper.style.display = "block";
    document.getElementById('content').style.marginRight = "20%";
    document.getElementById('bottom').style.width = "calc(100% - 20% - 30px)";

    updateQueueWindow();
}

function updateQueueWindow() {
    let queueWrapper = document.getElementById('queue');

    queueWrapper.innerHTML = " ";

    for (let i = 0; i < queue.length; i++) {
        console.log("it "+i)
        let fn = queue[i].fpz.split(/(\\|\/)/g).pop();

        getDetails(queue[i].fpz, async (tag) => {
            console.log(tag);
            console.log(queueWrapper.innerHTML)
            queueWrapper.innerHTML +=
            `<div class="queue-item">
                <p class="queue-detail queue-name">${fn.toUpperCase()}</p>
                <p class="queue-detail queue-details">${tag.tags.artist !== undefined ? tag.tags.artist : "Unknown artist"} - ${tag.tags.title !== undefined ? tag.tags.title : "Unknown title"}</p>
            </div>`;
        });
    }
}