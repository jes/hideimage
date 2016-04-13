$('#cover').change(function(e) {
    drawImage('cover');
});

$('#secret').change(function(e) {
    drawImage('secret');
});

$('#bits').change(function(e) {
    doHideImage();
});

var factor = {
    "cover": 1,
    "secret": 1,
};
var opposite = {
    "cover": "secret",
    "secret": "cover",
};

function drawImage(which, recursed) {
    var input = $('#' + which)[0];
    var id = '#' + which + 'canvas';

    var ctx = $(id)[0].getContext('2d');

    var targetw = $(id)[0].width;
    var targeth = $(id)[0].height;

    var img = new Image;
    img.onload = function() {
        var imgw = img.width;
        var imgh = img.height;
        var wfactor = img.width / targetw;
        var hfactor = img.height / targeth;
        factor[which] = wfactor;
        if (hfactor > factor)
            factor[which] = hfactor;

        var k = factor[which];
        if (factor[opposite[which]] > factor[which])
            k = factor[opposite[which]];

        // draw the image to the canvas
        ctx.clearRect(0, 0, 300, 300);
        ctx.drawImage(img, 0, 0, imgw / k, imgh / k);

        if (!recursed) {
            drawImage(opposite[which], 1);
        } else {
            doHideImage();
        }
    }
    img.src = URL.createObjectURL(input.files[0]);
    return ctx;
}

function hideImage() {
    drawImage('cover');
}

function doHideImage() {
    // TODO: load cover+secret again, from their file inputs, to get full-dimension images
    var cover = $('#covercanvas')[0];
    var coverctx = $('#covercanvas')[0].getContext('2d');
    var secret = $('#secretcanvas')[0];
    var secretctx = $('#secretcanvas')[0].getContext('2d');
    var output = $('#outputcanvas')[0];
    var outputctx = output.getContext('2d');

    var coverpixdata = coverctx.getImageData(0, 0, cover.width, cover.height);
    var secretpixdata = secretctx.getImageData(0, 0, secret.width, secret.height);
    var coverpix = coverpixdata.data;
    var secretpix = secretpixdata.data;

    var minw = cover.width;
    var minh = cover.height;
    if (secret.width < minw)
        minw = secret.width;
    if (secret.height < minh)
        minh = secret.height;

    var bits = $('#bits')[0].value;

    for (var y = 0; y < minh; y++) {
        for (var x = 0; x < minw; x++) {
            var coveridx = 4 * (y*cover.width + x);
            var secretidx = 4 * (y*secret.width + x);

            for (var chan = 0; chan < 4; chan++) {
                var mask = (0xff >>> bits) << bits;
                var coverc = coverpix[coveridx + chan];
                var secretc = secretpix[secretidx + chan];
                coverpix[coveridx + chan] = (coverc & mask) + (secretc >>> (8 - bits));
            }
        }
    }

    outputctx.putImageData(coverpixdata, 0, 0);
    // TODO: how to download the full-dimension output?
    // TODO: show preview of what extracted image will look like
}
