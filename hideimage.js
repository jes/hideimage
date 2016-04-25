$('#cover').change(function(e) {
    changed = true;
    loadImage('cover', drawImagePreview);
    $('#cover-preset').val('na');
});

$('#cover-preset').change(function(e) {
    changed = true;
    loadPresetImage('cover', drawImagePreview);
});

$('#secret').change(function(e) {
    changed = true;
    loadImage('secret', drawImagePreview);
});

$('#secret-preset').change(function(e) {
    changed = true;
    loadPresetImage('secret', drawImagePreview);
});

$('#bits').slider({
    min: 1,
    max: 7,
    slide: function(e, ui) {
        $('#bitsdisplay').text(ui.value);
        changed = true;
        if (loaded_img["cover"] && loaded_img["secret"])
            makeHideImagePreview(ui.value);
    },
});

$('#stegimage').change(function(e) {
    changed = true;
    loadImage('stegimage', drawUnhideImagePreview);
});

$('#stegimage-preset').change(function(e) {
    changed = true;
    loadPresetImage('stegimage', drawUnhideImagePreview);
});

$('#bits2').slider({
    min: 1,
    max: 7,
    slide: function(e, ui) {
        $('#unhidebitsdisplay').text(ui.value + " (release to process)");
    },
    change: function(e, ui) {
        $('#unhidebitsdisplay').text(ui.value);
        $('#unhidethrob').show();
        setTimeout(function() {
            changed = true;
            if (loaded_img["stegimage"])
                makeUnhideImagePreview(ui.value);
        }, 20);
    },
});

$('#unhiderow').hide();

$('#hide-switch').click(hide_switch);
$('#unhide-switch').click(unhide_switch);

function hide_switch() {
    $('#hiderow').show();
    $('#unhiderow').hide();
    $('#hide-switch').addClass('btn-primary');
    $('#hide-switch').removeClass('btn-default');
    $('#unhide-switch').addClass('btn-default');
    $('#unhide-switch').removeClass('btn-primary');
    if (window.location.hash)
        window.location.hash = '';
}

function unhide_switch() {
    $('#unhiderow').show();
    $('#hiderow').hide();
    $('#unhide-switch').addClass('btn-primary');
    $('#unhide-switch').removeClass('btn-default');
    $('#hide-switch').addClass('btn-default');
    $('#hide-switch').removeClass('btn-primary');
    window.location.hash = 'unhide';
}

if (window.location.hash == '#unhide')
    unhide_switch();

var changed = true;

$('#downloadbutton').prop('disabled', true);
$('#downloadbutton2').prop('disabled', true);

$('#downloadbutton').click(function(e) {
    if (!loaded_img["cover"] || !loaded_img["secret"]) {
        return;
    }

    $('#fullimgmodal').modal('show');

    if(!changed)
        return;

    $('#viewimg').hide();

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
        doHideImage(coverdata, secretdata, $('#bits').slider('value'));

        $('#loadingspan').text("Displaying...");
        setTimeout(function() {
            coverctx.putImageData(coverdata, 0, 0);
            changed = false;

            $('#viewimg').attr('src', cover.toDataURL());
            $('#viewimg').show();

            $('#loadingspan').html("Now right click and save the image.<br>Use the 'Unhide image' tool to retrieve the hidden image.");
        }, 20);
    }, 20);
});

$('#downloadbutton2').click(function(e) {
    if (!loaded_img["stegimage"]) {
        return;
    }

    $('#fullimgmodal').modal('show');

    if(!changed)
        return;

    $('#viewimg').hide();

    $('#loadingspan').text("Displaying...");
    setTimeout(function() {
        changed = false;

        $('#viewimg').attr('src', stegdataurl);
        $('#viewimg').show();

        $('#loadingspan').text("Now right click and save the image.");
    }, 20);
});

function downloadCanvas(link, canvas, filename) {
    link.href = canvas.toDataURL();
    link.download=filename;
}

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
    "stegimage": undefined,
};

var stegdataurl;

function drawImagePreview(which, recursed) {
    var id = '#' + which + 'canvas';

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
    ctx.drawImage(img, 0, 0, imgw / k, imgh / k);

    if (loaded_img[opposite[which]]) {
        if (!recursed) {
            drawImagePreview(opposite[which], 1);
        } else {
            makeHideImagePreview($('#bits').slider('value'));
        }
    }
}

function drawUnhideImagePreview() {
    var ctx = $('#stegcanvas')[0].getContext('2d');

    var imgw = loaded_img["stegimage"].width;
    var imgh = loaded_img["stegimage"].height;

    var k = imgw / 300;
    if ((imgh / 300) > k)
        k = imgh / 300;

    ctx.clearRect(0, 0, 300, 300);
    ctx.drawImage(loaded_img["stegimage"], 0, 0, imgw / k, imgh / k);

    makeUnhideImagePreview();
}

function makeHideImagePreview(bits) {
    $('#downloadbutton').prop('disabled', false);
    var ctx = $('#outputcanvas')[0].getContext('2d');
    ctx.clearRect(0, 0, 300, 300);
    ctx.font = '15px sans-serif';
    ctx.fillText("Processing...", 10, 30);

    setTimeout(function() {
        var coverctx = $('#covercanvas')[0].getContext('2d');
        var coverdata = coverctx.getImageData(0, 0, loaded_img["cover"].width/k, loaded_img["cover"].height/k);
        var secretctx = $('#secretcanvas')[0].getContext('2d');
        var secretdata = secretctx.getImageData(0, 0, loaded_img["secret"].width/k, loaded_img["secret"].height/k);

        doHideImage(coverdata, secretdata, bits);

        ctx.clearRect(0, 0, 300, 300);
        ctx.putImageData(coverdata, 0, 0);
    }, 20);
}

function makeUnhideImagePreview() {
    $('#downloadbutton2').prop('disabled', false);
    var ctx = $('#hiddencanvas')[0].getContext('2d');
    ctx.clearRect(0, 0, 300, 300);
    ctx.font = '15px sans-serif';
    ctx.fillText("Processing...", 10, 30);

    setTimeout(function() {
        var steg = document.createElement('canvas');

        var imgw = loaded_img["stegimage"].width;
        var imgh = loaded_img["stegimage"].height;

        steg.width = imgw;
        steg.height = imgh;
        var stegctx = steg.getContext('2d');
        stegctx.drawImage(loaded_img["stegimage"], 0, 0, imgw, imgh);
        var stegdata = stegctx.getImageData(0, 0, imgw, imgh);

        // make a full size canvas and unhide image on it, then scale that down for display
        // cache the result so that it can be downloaded quicker

        doUnhideImage(stegdata, $('#bits2').slider('value'));

        var k = imgw / 300;
        if ((imgh / 300) > k)
            k = imgh / 300;

        var img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, 300, 300);
            ctx.drawImage(img, 0, 0, imgw / k, imgh / k);
        }
        stegctx.putImageData(stegdata, 0, 0);
        stegdataurl = steg.toDataURL();
        img.src = stegdataurl;
    }, 20);
}

function loadImage(which, cb) {
    var input = $('#' + which)[0];

    loaded_img[which] = undefined;

    var img = new Image;
    img.onload = function() {
        loaded_img[which] = img;
        cb(which);
    }
    img.src = URL.createObjectURL(input.files[0]);
}

function loadPresetImage(which, cb) {
    loaded_img[which] = undefined;

    var img = new Image;
    img.onload = function() {
        loaded_img[which] = img;
        cb(which);
    }
    img.src = $('#'+which+'-preset').val() + '.png';
}

function hideImage() {
    loadImage('cover', drawImagePreview);
    loadImage('secret', drawImagePreview);
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

    var mask = (0xff >>> bits) << bits;

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
}

function doUnhideImage(stegdata, bits) {
    var stegpix = stegdata.data;

    var w = stegdata.width;
    var h = stegdata.height;

    for (var y = 0; y < h; y++) {
        var stegy = y*w;
        for (var x = 0; x < w; x++) {
            var stegidx = 4*(stegy + x);

            // red
            stegpix[stegidx] = (stegpix[stegidx] << (8 - bits)) & 0xff;

            // green
            ++stegidx;
            stegpix[stegidx] = (stegpix[stegidx] << (8 - bits)) & 0xff;

            // blue
            ++stegidx;
            stegpix[stegidx] = (stegpix[stegidx] << (8 - bits)) & 0xff;
        }
    }
}
