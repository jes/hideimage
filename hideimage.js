$('#cover').change(function(e) {
    loadImage('cover');
});

$('#secret').change(function(e) {
    loadImage('secret');
});

$('#bits').change(function(e) {
    makeHideImagePreview();
});

var pixpersec = 0;

$('#downloadbutton').click(function(e) {
    if (!loaded_img["cover"] || !loaded_img["secret"]) {
        alert("Nope.");
        return;
    }

    $('#loadingspan').text("Processing...");
    setTimeout(function() {
        var cover = document.createElement('canvas');
        var secret = document.createElement('canvas');

        cover.width = loaded_img["cover"].width;
        cover.height = loaded_img["cover"].height;
        secret.width = loaded_img["secret"].width;
        secret.height = loaded_img["secret"].height;

        var coverctx = cover.getContext('2d');
        var secretctx = secret.getContext('2d');

        coverctx.clearRect(0, 0, cover.width, cover.height);
        coverctx.drawImage(loaded_img["cover"], 0, 0);
        secretctx.clearRect(0, 0, secret.width, secret.height);
        secretctx.drawImage(loaded_img["secret"], 0, 0);

        var coverdata = coverctx.getImageData(0, 0, cover.width, cover.height);
        var secretdata = secretctx.getImageData(0, 0, secret.width, secret.height);
        var start = window.performance.now();
        doHideImage(coverdata, secretdata, $('#bits')[0].value);
        var end = window.performance.now();
        console.log("doHideImage took " + ((end - start) / 1000) + " secs");

        $('#loadingspan').text("Displaying...");
        setTimeout(function() {
            coverctx.putImageData(coverdata, 0, 0);

            $('#viewimg').attr('src', cover.toDataURL());
            $('#viewimg').show();

            $('#loadingspan').text("Now right click, save image");
        }, 20);
    }, 20);
});

var factor = {
    "cover": 0.001,
    "secret": 0.001,
};
var k = 0.001;
var opposite = {
    "cover": "secret",
    "secret": "cover",
};

var loaded_img = {
    "cover": undefined,
    "secret": undefined,
};

function drawImagePreview(which, recursed) {
    var id = '#' + which + 'canvas';

    $('#viewimg').hide();

    var ctx = $(id)[0].getContext('2d');

    var targetw = $(id)[0].width;
    var targeth = $(id)[0].height;

    var img = loaded_img[which];
    var imgw = img.width;
    var imgh = img.height;
    var wfactor = img.width / targetw;
    var hfactor = img.height / targeth;
    factor[which] = wfactor;
    if (hfactor > factor[which])
        factor[which] = hfactor;

    k = factor[which];
    if (factor[opposite[which]] > factor[which])
        k = factor[opposite[which]];

    // draw the image to the canvas
    ctx.clearRect(0, 0, targetw, targeth);
    console.log("ctx.drawImage(" + which + ", " + (imgw/k) + ", " + (imgh/k) + "; k=" + k);
    ctx.drawImage(img, 0, 0, imgw / k, imgh / k);

    if (loaded_img[opposite[which]]) {
        if (!recursed) {
            drawImagePreview(opposite[which], 1);
        } else {
            makeHideImagePreview();
        }
    }
}

function makeHideImagePreview() {
    var coverctx = $('#covercanvas')[0].getContext('2d');
    var secretctx = $('#secretcanvas')[0].getContext('2d');
    var coverdata = coverctx.getImageData(0, 0, loaded_img["cover"].width/k, loaded_img["cover"].height/k);
    var secretdata = secretctx.getImageData(0, 0, loaded_img["secret"].width/k, loaded_img["secret"].height/k);

    doHideImage(coverdata, secretdata, $('#bits')[0].value);

    var secs = 2 * (loaded_img["cover"].width * loaded_img["cover"].height) / pixpersec;
    $('#loadingspan').text("Est. " + secs.toFixed(1)  + " seconds.");

    var outputctx = $('#outputcanvas')[0].getContext('2d');
    outputctx.putImageData(coverdata, 0, 0);
}


function loadImage(which, recursed) {
    var input = $('#' + which)[0];

    loaded_img[which] = undefined;

    var img = new Image;
    img.onload = function() {
        loaded_img[which] = img;
        drawImagePreview(which, recursed);
    }
    img.src = URL.createObjectURL(input.files[0]);
}

function hideImage() {
    loadImage('cover');
    loadImage('secret');
}

// hides secretdata into coverdata
function doHideImage(coverdata, secretdata, bits) {
    var coverpix = coverdata.data;
    var secretpix = secretdata.data;

    var minw = coverdata.width;
    var minh = coverdata.height;
    if (secretdata.width < minw)
        minw = secretdata.width;
    if (secretdata.height < minh)
        minh = secretdata.height;

    console.log("minw = " + minw); console.log("minh = " + minh);

    var mask = (0xff >>> bits) << bits;

    var start = window.performance.now();

    for (var y = 0; y < minh; y++) {
        var covery = y*coverdata.width;
        var secrety = y*secretdata.width;
        for (var x = 0; x < minw; x++) {
            var coveridx = 4 * (covery + x);
            var secretidx = 4 * (secrety + x);

            // red
            coverpix[coveridx] = (coverpix[coveridx] & mask) + (secretpix[secretidx] >>> (8 - bits));

            // green
            ++coveridx;
            coverpix[coveridx] = (coverpix[coveridx] & mask) + (secretpix[++secretidx] >>> (8 - bits));

            // blue
            ++coveridx;
            coverpix[coveridx] = (coverpix[coveridx] & mask) + (secretpix[++secretidx] >>> (8 - bits));
        }
    }

    var end = window.performance.now();
    pixpersec = (minw * minh) / ((end - start) / 1000);

    // TODO: how to download the full-dimension output?
    // TODO: show preview of what extracted image will look like
}

$('#viewimg').hide();
