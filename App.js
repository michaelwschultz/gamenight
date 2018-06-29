import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import firebase, { auth } from './firebase.js';

export default class App extends React.Component {
  constructor() {
    super()

    this.logginUser = this.logginUser.bind(this)

    let me
    firebase.auth().signInAnonymously().catch(function(error) {
      var errorCode = error.code
      var errorMessage = error.message
    })

    firebase.auth().onAuthStateChanged(function(user) {
      if (user) {
        // User is signed in.
        var isAnonymous = user.isAnonymous
        var uid = user.uid
        me = user
      } else {
        // User is signed out.
        me = user
        console.log('no user logged in')
      }
    })

    this.state = {
      me,
      buds: ['Klein', 'Jackson', 'JV']
    }
  }

  logginUser() {
    const auth = firebase.auth()
    const currentUser = auth.currentUser

    currentUser.updateProfile({
      displayName: 'Michael',
    }).then(function() {
      console.log(currentUser.displayName)

      this.setState({
        me: currentUser
      })
    }.bind(this), function(error) {
      // An error happened.
      console.log('User wasn’t updated')
    })
  }

  async buttonClickHandler(newBud) {
    if (!this.state.buds.includes(newBud)) {
      await this.setState(previousState => ({
        buds: [...previousState.buds, newBud]
      }))
    } else {
      const buds = [...this.state.buds]
      const index = buds.indexOf(newBud)
      buds.splice(index, 1)
      await this.setState({
        buds
      })
    }

    console.log('status button clicked ', this.state.buds)
  }

  render() {
    const me = this.state.me

    return (
      <View style={styles.container}>

      {me &&
        <View style={styles.headerArea}>
          <Text style={styles.name}>
            Yo, {me.displayName}!
          </Text>
          <Text style={styles.headline}>
            You down for games tonight?
          </Text>
        </View>
      }

        <View style={styles.buttonArea}>
          {me ?
            <View style={styles.button}>
              <Button
                onPress={e => this.buttonClickHandler(me.displayName)}
                title={this.state.buds.includes(me.displayName) ? 'I’m Out' : 'I’m Down'}
                color='#292C3F'
                accessibilityLabel='Click this button to let everyone know that your down for gaming tonight'
              />
            </View>
          :
            <View style={styles.button}>
              <Button
                onPress={e => this.logginUser()}
                title='Login'
                color='#292C3F'
                accessibilityLabel='Click this button to let everyone know that your down for gaming tonight'
              />
            </View>
          }
        </View>

        {me &&
          <View style={styles.budsArea}>
            {this.state.buds.map(bud => {
              return (
                <View style={styles.bud} key={bud}>
                  <Text>{bud}</Text>
                </View>
              )
            })}
          </View>
        }

      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 40,
    backgroundColor: '#292C3F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerArea: {
    flex: 1,
    justifyContent: 'center',
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 21,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 32,
  },
  buttonArea: {
    flex: 1,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#F98C63',
    borderRadius: 6,
    paddingTop: 16,
    paddingRight: 24,
    paddingBottom: 16,
    paddingLeft: 24,
  },
  budsArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bud: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    width: 72,
    height: 72,
    margin: 8,
  },
})
