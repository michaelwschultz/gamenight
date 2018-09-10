import React from 'react'
import { Animated, Button, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import posed from 'react-native-pose'
import firebase, { auth } from './firebase.js'

// These constants need to be set before componentDidMount
// TODO should be moved to a function rather than floating out here
const TWEEN = ({ value, toValue, useNativeDriver }) =>
  Animated.timing(value, {
    toValue,
    useNativeDriver,
    duration: 1000,
  })
const CONFIG = {
  bright: {
    shadowRadius: 10,
    shadowOpacity: 1,
    transition: TWEEN
  },
  dim: {
    shadowRadius: 8,
    shadowOpacity: 0.3,
    transition: TWEEN
  }
}
const BLINKINGDOT = posed.View(CONFIG)

export default class App extends React.Component {
  constructor() {
    super()

    this.state = {
      authed: false,
      buds: {},
      me: {},
      name: '',
      registered: false,
      isBright: true
    }
  }

  componentDidMount() {
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
        console.log(JSON.stringify(user) + ' authed')

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

    // Blink status dot next to each bud
    setInterval(() => {
      this.setState({ isBright: !this.state.isBright })
    }, 1000)
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

  renderNavigation(me, registered) {
    return (
      <View>
        <StatusBar
          barStyle='light-content'
        />
        <View style={styles.navigationArea}>
          <View style={styles.navAffordance} />
          <View style={styles.navAffordance}>
            <Text style={styles.navigationText}>
              Game Night
            </Text>
          </View>
          <View style={styles.navAffordance}>
            <TouchableOpacity
              style={styles.accountButton}
              onPress={e => this.signOut(me)}
            >
              <Text style={[styles.buttonText, { textAlign: 'right', color: '#474747', fontSize: 14 }]}>
                {me && registered ? 'Sign Out' : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    )
  }

  renderHeadline(me) {
    return (
      <View style={styles.headlineArea}>
        <Text style={styles.name}>
          Yo, {me.name}!
        </Text>
        <Text style={styles.headline}>
          You down for games tonight?
        </Text>
      </View>
    )
  }

  renderPrompt(me, registered) {
    return (
      <View style={styles.cta}>
        {registered && me && this.renderHeadline(me)}
        <View style={styles.buttonArea}>
          {registered && me ?
            <TouchableOpacity
              style={[styles.button, me.status ? styles.budStatusOut : styles.budStatusDown]}
              onPress={e => this.changeStatus(me)}
            >
              <Text style={styles.buttonText}>
                {me.status ? 'I’m Out' : 'I’m Down'}
              </Text>
            </TouchableOpacity>
          :
            <View>
              <TextInput
                style={{ color: '#FFFFFF', height: 56, borderColor: '#474747', borderWidth: 1, borderRadius: 6 }}
                onChangeText={(name) => this.setState({name})}
                defaultValue={this.state.name}
              />
              <View style={styles.button}>
                <Button
                  onPress={e => this.registerUser(this.state.name)}
                  disabled={!this.state.name}
                  title='Register'
                  style={styles.registerButton}
                  accessibilityLabel='Click this button to let everyone know that your down for gaming tonight'
                />
              </View>
            </View>
          }
        </View>
      </View>
    )
  }

  renderBuds() {
    const { buds, isBright } = this.state
    const budsArray = []

    for (const key of Object.keys(buds)) {
      if (buds[key].status) {
        budsArray.push(
          <View style={styles.bud} key={`${buds[key].uid}-bud`}>
            <BLINKINGDOT
              pose={isBright ? 'bright' : 'dim'}
              style={[styles.budStatusLight, styles.budStatusDown]}
            />
            <Text style={[styles.budText, styles.budInactive]}>{buds[key].name}</Text>
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
          {this.renderNavigation(me, registered)}
          {registered && me &&
            <View style={styles.budsArea}>
              <ScrollView contentContainerStyle={styles.budsScrollView}>
                {this.renderBuds()}
              </ScrollView>
            </View>
          }
          {this.renderPrompt(me, registered)}
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
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navigationArea: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 56,
    marginBottom: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  navAffordance: {
    flex: 1,
    justifyContent: 'space-evenly',
  },
  navigationText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  headlineArea: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    width: '100%',
  },
  headline: {
    color: '#FFFFFF',
    fontSize: 21,
  },
  name: {
    color: '#FFFFFF',
    fontSize: 24,
  },
  nameInput: {
   flex: 1,
   justifyContent: 'center',
   backgroundColor: '#292C3F'
  },
  cta: {
    flex: 2,
    paddingHorizontal: 16,
    width: '100%',
  },
  buttonArea: {
    flex: 1,
    paddingHorizontal: 16,
    width: '100%',
  },
  button: {
    width: '100%',
    padding: 24,
    alignItems: 'center',
    borderRadius: 6,
    shadowRadius: 20,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: 0 },
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 19,
  },
  budsArea: {
    flex: 4,
    width: '100%',
  },
  budsScrollView: {
    flex: 1,
    width: '100%',
    paddingHorizontal: 16,
  },
  bud: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
  },
  budText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  budInactive: {
    color: '#474747',
  },
  budStatusLight: {
    width: 16,
    height: 16,
    marginRight: 16,
    borderRadius: 100,
    backgroundColor: '#474747',
    shadowOffset: { width: 0, height: 0 },
  },
  budStatusDown: {
    backgroundColor: '#13CC84',
    shadowColor: '#00FF9E',
  },
  budStatusOut: {
    backgroundColor: '#EC3F52',
    shadowColor: '#FF001C',
  }
})
