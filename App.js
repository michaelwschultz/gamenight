import React from 'react'
import { StyleSheet, Text, View, Button, TextInput } from 'react-native'
import firebase, { auth } from './firebase.js'

export default class App extends React.Component {
  constructor() {
    super()

    this.state = {
      authed: false,
      buds: {},
      me: {},
      name: '',
      registered: false
    }
  }

  componentDidMount () {
    const auth = firebase.auth()
    const db = firebase.database()

    auth.signInAnonymously().catch((error) => {
      const errorCode = error.code
      const errorMessage = error.message
    })

    auth.onAuthStateChanged(async (user) => {
      if (user) {
        // User is signed in
        let me
        const authed = true
        console.log(user + ' authed')

        const eventref = db.ref('buds/')
        const snapshot = await eventref.once('value')
        const buds = snapshot.val()

        console.log('AUTH BUDS ', buds, user.uid)
        if (buds.hasOwnProperty(user.uid)) {
          me = buds[user.uid]
          me.uid = user.uid // adds uid to user object
        }

        this.setState({
          authed,
          buds,
          me,
          registered: true
        })
      } else {
        // User is signed out
        console.log('no user logged in')

        this.setState({
          buds: {},
          me: {},
          registered: false
        })
      }
    })

    // Setup listener for buds database
    // This fires everytime the database changes
    const buds = db.ref('buds/')
    buds.on('value', function(snapshot) {
      this.setState({
        buds: snapshot.val()
      })
    }.bind(this))
  }

  signOut(me) {
    // Use this to de-auth the user for real
    // const auth = firebase.auth()
    // auth.signOut().then(function() {
    //   console.log('Signed out')
    // }.bind(this), function(error) {
    //   console.log('Problem signing out ', error)
    // })

    // Soft sign out
    this.setState({
      registered: false
    })
  }

  async changeStatus(me) {
    const db = firebase.database()
    const eventref = db.ref('buds/' + me.uid + '/status')
    const snapshot = await eventref.once('value')

    let status
    status = snapshot.val()

    // Toggle status
    status = !status
    me.status = status

    db.ref('buds/' + me.uid).update({
      status
    }).then(
      this.setState({
        me
      })
    )
  }

  registerUser(name) {
    const auth = firebase.auth()
    const me = auth.currentUser
    const db = firebase.database()

    db.ref('buds/' + me.uid).set({
      name,
      status: false,
      uid: me.uid
    })

    this.setState({
      me: {
        name,
        status: false,
        uid: me.uid
      },
      name: '',
      registered: true
    })
  }

  renderBuds() {
    const { buds } = this.state
    const budsArray = []

    for (const key of Object.keys(buds)) {
      if (buds[key].status) {
        budsArray.push(
          <View style={styles.bud} key={`${buds[key].uid}-bud`}>
            <Text>{buds[key].name}</Text>
          </View>
        )
      }
    }
    return budsArray
  }

  render() {
    const { authed, me, registered } = this.state

    if (authed) {
      return (
        <View style={styles.container}>
          {registered && me &&
            <View style={styles.headerArea}>
              <Text style={styles.name}>
                Yo, {me.name}!
              </Text>
              <Text style={styles.headline}>
                You down for games tonight?
              </Text>
              <View style={styles.button}>
                <Button
                  onPress={e => this.signOut(me)}
                  title='Sign out'
                  color='#292C3F'
                  accessibilityLabel='Tap to sign out'
                />
              </View>
            </View>
          }

          <View style={styles.buttonArea}>
            {registered && me ?
              <View style={styles.button}>
                <Button
                  onPress={e => this.changeStatus(me)}
                  title={me.status ? 'I’m Out' : 'I’m Down'}
                  color='#292C3F'
                  accessibilityLabel='Tap to let everyone know that your down for gaming tonight'
                />
              </View>
            :
              <View>
                <TextInput
                  style={{height: 40, borderColor: 'gray', borderWidth: 1}}
                  onChangeText={(name) => this.setState({name})}
                  defaultValue={this.state.name}
                />
                <View style={styles.button}>
                  <Button
                    onPress={e => this.registerUser(this.state.name)}
                    disabled={!this.state.name}
                    title='Register'
                    color='#292C3F'
                    accessibilityLabel='Click this button to let everyone know that your down for gaming tonight'
                  />
                </View>
              </View>
            }
          </View>

          {registered && me &&
            <View style={styles.budsArea}>
              {this.renderBuds()}
            </View>
          }
        </View>
      )
    }

    return (
     <View style={styles.container}>
      <Text>Loading...</Text>
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
  nameInput: {
   flex: 1,
   justifyContent: 'center',
   backgroundColor: '#292C3F'
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
