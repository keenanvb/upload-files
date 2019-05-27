import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import axios from 'axios'


class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      file: null,
      availableFile: null
    }

  }

  componentDidMount() {
    this.getData();
  }

  getData = () => {
    axios.get('http://localhost:3000/files')
      .then((response) => {
        console.log(response.data);
        this.setState({
          availableFile: response.data
        });
      })
      .catch((error) => {
        this.setState({
          availableFile: null
        });
        // console.log(error);
      });
  }

  delete = (fileName) => {
    axios.delete(`http://localhost:3000/files/remove/${fileName}`)
      .then((response) => {
        // console.log(response.data);
        this.getData();
      })
      .catch((error) => {
        console.log(error);
      });
  }

  handleSubmit = (e) => {
    e.preventDefault()
    let currentFile = this.state.file
    let formData = new FormData();
    formData.append('file', currentFile, currentFile.name);

    axios.post(
      'http://localhost:3000/upload',
      formData, {
        onUploadProgress: progressEvent => {
          let { loaded, total } = progressEvent;
          // console.log('upload' + Math.round(loaded / total * 100))
        }
      }
    ).then((response) => {
      // console.log(response);
      this.getData();
    }).catch((error) => {
      // console.log(error);
    });
  }

  displayData = () => {
    let files = this.state.availableFile ? (
      this.state.availableFile.map((file, index) => {
        let display = `http://localhost:3000/files/${file.filename}`
        let download = `http://localhost:3000/files/download/${file.filename}`
        return (
          <div key={index}>
            <a href={display} target="_blank">dislaply</a>
            <a href={download}>download</a>
            <div>{file.filename} </div>
            <button onClick={() => { this.delete(file.filename) }}>delete</button>
          </div>
        )
      })
    ) : (
        <p>No Files available</p>
      )
    return files;
  }

  onChange = (e) => {
    let actualfile = e.target.files[0];
    this.setState({
      file: actualfile
    });
  }

  render() {
    return (
      <div className="App">
        <form onSubmit={(e) => { this.handleSubmit(e) }}>
          <input type="file" name='file' onChange={(e) => { this.onChange(e) }} />
          {/* <input type="file" multiple name='file' onChange={(e) => { this.onChange(e) }} /> */}
          <input type="submit" value="Submit" />
        </form>
        <hr />
        {this.displayData()}
      </div >
    );
  }
}

export default App;
