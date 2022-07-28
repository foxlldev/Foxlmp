let { remote } = require('electron');
let jsmt = require('jsmediatags');
let dialog = remote.dialog;
let mainWindow = remote.getCurrentWindow();

let gaudio = null;

let selectFileButton = document.getElementById('selectFileButton');
let playButton = document.getElementById('playButton');
let setVolButton = document.getElementById('setVolButton');
let loopToggle = document.getElementById('looptgl');

var latestvolume = 1;

function updateTime() {
    var current = new Date(null);
    current.setSeconds(gaudio.currentTime);
    var duration = new Date(null);
    duration.setSeconds(gaudio.duration);
    //document.getElementById('timelbl').innerText = Math.round(gaudio.currentTime/60*100)/100+"/"+Math.round(gaudio.duration/60*100)/100;
    document.getElementById('timelbl').innerText = current.toISOString().substr(14,5)+" / "+duration.toISOString().substr(14,5);

    if (current >= duration && loopToggle.checked) {
        gaudio.play();
    }
}

playButton.onclick = async () => {
    if (gaudio != null) {
        if (gaudio.paused){gaudio.play();playButton.innerText="Pause";}
        else if (!gaudio.paused){gaudio.pause();playButton.innerText="Play";}
    }
}

setVolButton.onclick = async () => {
    let volinpval = document.getElementById('volinp').value;
    if (gaudio != null) {gaudio.volume = volinpval/100; console.log("new gaudio volume: "+gaudio.volume)}
    latestvolume = volinpval;
}

selectFileButton.onclick = async () => {
    let file = await dialog.showOpenDialog(mainWindow, {
        filters: [
            {
                name: 'Music files',
                extensions: ['mp3', 'wav']
            }
        ]
    });

    if (file != undefined || file != null) {
        let audio = new Audio(file.filePaths[0]);
        if (gaudio != null) { gaudio.pause(); gaudio.currentTime = 0; }
        gaudio = new Audio(file.filePaths[0]);
        gaudio.play();

        gaudio.volume = latestvolume/100;

        document.getElementById('playButton').style.display = "initial";

        document.getElementById('timelbl').innerText = "Loading...";
        setInterval(updateTime, 1000);

        try {var fn = file.filePaths[0].split(/(\\|\/)/g).pop(); } catch(err) {console.log(err);}

        jsmt.read(file.filePaths[0], {
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
                // Title
                console.log("file name: "+fn);
                if (tag.tags.title != undefined){document.getElementById('title').innerText = tag.tags.title+" ("+fn+")";}
                else if (tag.tags.title == undefined){document.getElementById('title').innerText = "Unknown ("+fn+")";}

                // Artist : Album
                if (tag.tags.artist != undefined && tag.tags.album != undefined){document.getElementById('artistalbum').innerText = tag.tags.artist + " : " + tag.tags.album;}
                else if (tag.tags.artist != undefined && tag.tags.album == undefined){document.getElementById('artistalbum').innerText = tag.tags.artist + " : " + "Unknown"}
                else if (tag.tags.artist == undefined && tag.tags.album != undefined){document.getElementById('artistalbum').innerText = "Unknown" + " : " + tag.tags.album;}
                else if (tag.tags.artist == undefined && tag.tags.album == undefined){document.getElementById('artistalbum').innerText = "Unknown";}
                else {console.log("error");}

                console.log(tag);
                playButton.innerText = "Pause";
            },
            onError: (error) => {
                console.log(error);
            }
        });
    }
}