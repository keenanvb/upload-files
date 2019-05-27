const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');

const cors = require('cors');

const app = express();

app.use(cors());
//Mongo URI
const mongoURI = 'mongodb://localhost:27017/document-storage';

//connection
mongoose.Promise = global.Promise;
let conn = mongoose.createConnection(mongoURI);


//init stream
let gfs;
conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads')
});

//storage object
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        // console.log('file', file);
        return new Promise((resolve, reject) => {
            // crypto.randomBytes(16, (err, buf) => {
            // if (err) {
            //     return reject(err);
            // }
            // const filename = buf.toString('hex') + path.extname(file.originalname);
            const filename = file.originalname;
            const fileInfo = {
                filename: filename,
                bucketName: 'uploads'
                // metadata: {
                //     metadata: 'true'
                // }
            };
            resolve(fileInfo);
            // });
        });
    }
});

const upload = multer({ storage });

app.get('/', (req, res) => {
    res.send({ 'hello': 'hello' });
    console.log('im here')
});

/**
 * Upload file 
 */
app.post('/upload', upload.single('file'), (req, res) => {
    res.json({
        file: req.file
    });
});

/**
 * Get files
 */
app.get('/files', (req, res) => {

    gfs.files.find({}).toArray((err, files) => {
        if (!files || files.length == 0) {
            return res.status(404).send({
                err: "No files exisit"
            });
        }

        return res.send(files);
    })
});

/**
* Get file
*/
app.get('/files/:filename', (req, res) => {

    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length == 0) {
            return res.status(404).send({
                err: "No file exisit"
            });
        }
        //return res.send(file);

        if (file.contentType == 'application/pdf') {
            gfs.createReadStream(file.filename, {
                'flags': 'r',
                'encoding': 'binary',
                'mode': 0666,
                'bufferSize': 4 * 1024
            }).on("data", function (chunk) {
                res.write(chunk, 'binary');
            }).on("close", function () {
                res.end();
            });
        } else {
            res.status(404).send({
                err: " This is not a pdf file"
            })
        }
    })
});

/**
* download the file
*/
app.get('/files/download/:filename', (req, res) => {
    gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
        if (!file || file.length == 0) {
            return res.status(404).send({
                err: "No file exisit"
            });
        }

        if (file.contentType == 'application/pdf') {
            res.writeHead(200, {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename=${file.filename}`
            });
            gfs.createReadStream(file.filename, {
                'flags': 'r',
                'encoding': 'binary',
                'mode': 0666,
                'bufferSize': 4 * 1024
            }).on("data", function (chunk) {
                res.write(chunk, 'binary');
            }).on("close", function () {
                res.end();
            });
        }
    })
});

/**
* delete  the file
*/
app.delete('/files/remove/:filename', (req, res) => {
    console.log('req.params.filename', req.params.filename);
    gfs.exist({ filename: req.params.filename, root: 'uploads' }, (err, found) => {
        if (err) {
            return res.send({
                message: err
            })
        }
        if (found) {
            gfs.remove({ filename: req.params.filename, root: 'uploads' }, (err, gridStore) => {
                if (err) {
                    return res.status(404).send({
                        err: err
                    })
                } else {
                    return res.send({
                        message: "success"
                    })
                }
            });
        } else {
            return res.send({
                message: 'File not found'
            })
        }
    });
});

app.get('/downloadFile', (req, res) => {
    // res.writeHead(200, {
    //     'Content-Type': 'application/pdf',
    //     'Content-Disposition': 'attachment; filename=Eloquent_JavaScript.pdf'
    // });

    let filePath = path.join(__dirname, 'js.pdf');

    // let readStream = fs.createReadStream(filePath);
    // readStream.pipe(res);

    fs.createReadStream(filePath, {
        'flags': 'r',
        'encoding': 'binary',
        'mode': 0666,
        'bufferSize': 4 * 1024
    }).on("data", function (chunk) {
        res.write(chunk, 'binary');
    }).on("close", function () {
        res.end();
    });

});

const port = 3000;

app.listen(port, () => {
    console.log('listening on port: ', port);
})  