import React, { Component } from 'react';

class User extends Component {
  constructor(props) {
    super(props);
    // this.onlineStatusRef = firebase.database().ref('signedInUsers');
  }

  componentDidMount() {
    this.props.firebase.auth().onAuthStateChanged((user) => {
      // console.log('user.js: onAuthStateChanged --- ', user);
      this.handleUserStatus(user);
      this.props.setUser(user);
    });

    // window.addEventListener('beforeunload', (e => {
    // window.addEventListener('close', (e => {
    //   this.handleUserStatus(null);
      //custom message not working !
      // var confirmationMessage = "You will be signed off from Chatterbox.";
      // (e || window.event).returnValue = confirmationMessage; //Gecko + IE
      // return confirmationMessage;                            //Webkit, Safari, Chrome
    // }));
  }

  componentWillUnmount() {
    this.props.firebase.auth().off();
    // this.state.onlineStatusRef.off('value');
  }

  handleUserStatus(user) {
    if (user) {
      console.log('onAuthStateChanged: ' + user.displayName + ' signed in');
      const ref = this.props.firebase.database().ref('signedInUsers/' + user.uid);
      ref.child('isTyping').set('false').catch((error) => {
        alert('onAuthStateChanged-add online user: ' + error.message);
      })
    }
    else {
      console.log('onAuthStateChanged: ' + this.props.currentUser.displayName + ' signed out');
      this.props.firebase.database().ref('signedInUsers/' + this.props.currentUser.uid).remove().catch((error) => {
        alert('onAuthStateChanged-remove online user: ' + error.message);
      })
    }
  }

  handleSignOut() {
    //console.log('in handleSignOut!');
    this.props.firebase.auth().signOut().then(() => {
      //console.log('handleSignOut succeeded');
      // firebase.auth().onAuthStateChanged catches all user changes and calls setUser() anyway
      // console.log('User.js: SIGNED OUT!');
    }).catch((error) => {
      alert('Sign out error: ' + error.message);
    });
  }

  handleSignIn() {
    const provider = new this.props.firebase.auth.GoogleAuthProvider();

    this.props.firebase.auth().setPersistence(this.props.firebase.auth.Auth.Persistence.SESSION)
      .then(() => {
        this.props.firebase.auth().signInWithPopup(provider).then((result) => {
          // firebase.auth().onAuthStateChanged catches all user changes and calls setUser() anyway
          console.log('User.js: SIGNED IN!');
        }).catch((error) => {
          alert(`Sign in errorMessage=${error.message} email=${error.email} credential=${error.credential}`);
        });
      })
      .catch((error) => {
        alert('setPersistence error: ' + error.message);
      });
  }

  render() {
    let name, button;
    if (this.props.currentUser) {
     name = this.props.currentUser.displayName;
     button = <button className="btn btn-outline-warning ml-3" name='SignOut' id='singOut' onClick={() => this.handleSignOut()}><i className="fas fa-user-times"></i> Log out</button>
    } else {
      name = 'Guest';
      button = <img src='/googleSignIn1.png' id='googleSingIn' alt='Google signin icon' width='180px' style={{marginLeft:'5px', border:'1px groove lightgrey'}} onClick={() => this.handleSignIn()} />;
    }

     return (
      <div className={this.props.className}>
        <p className='pt-3 float-right'>
          <span className='font-weight-bold'><i className="fas fa-user ml-3"></i> {name} </span> 
          <span>{button}</span>
        </p>
      </div>
    )
  }
};

export default User;
