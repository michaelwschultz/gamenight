import React from 'react'
import { StyleSheet, Text, View, Button } from 'react-native'
import firebase, { auth } from './firebase.js'

export default class App extends React.Component {
  constructor() {
    super()
    this.loginUser = this.loginUser.bind(this)

    this.state = {
      authed: false,
      buds: {},
      me: {}
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
        console.log(user.displayName + ' logged in')

        const eventref = db.ref('buds/')
        const snapshot = await eventref.once('value')
        const buds = snapshot.val()

        if (buds.hasOwnProperty(user.uid)) {
          me = buds[user.uid]
          me.uid = user.uid // adds uid to user object
        }

        this.setState({
          authed,
          buds,
          me
        })
      } else {
        // User is signed out
        console.log('no user logged in')

        this.setState({
          authed: false,
          buds: {},
          me: {}
        })
      }
    })
  }

  async buttonClickHandler(me) {
    // const { buds } = this.state

    // if (!buds.hasOwnProperty(me.uid)) {
    //   await this.setState(previousState => ({
    //     buds: [...previousState.buds, me]
    //   }))
    // } else {
    //   const buddies = [...buds]
    //   const index = buddies.indexOf(me.displayName)
    //   buddies.splice(index, 1)
    //   await this.setState({
    //     buds: buddies
    //   })
    // }

    // if (budsObject) {
      // Builds up array of firebase users
      // for (const key of Object.keys(budsObject)) {
      //   if (budsObject[key].status) {
      //     buds.push(budsObject[key].name)
      //   }
      // }
    // Update firebase
    this.changeStatus(me)
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
    console.log('MY STATUS ', status)
    
    db.ref('buds/' + me.uid).update({
      status
    }).then(
      this.setState({
        me
      })
    )
  }

  loginUser() {
    const auth = firebase.auth()
    const currentUser = auth.currentUser
    const db = firebase.database()

    db.ref('buds/' + currentUser.uid).set({
      name: currentUser.name,
      status: false
    })
    this.setState({
      me: currentUser
    })
  }

  render() {
    const { authed, buds, me } = this.state

    console.log('RENDER STATUS ', me.status)

    if (authed) {
      return (
        <View style={styles.container}>
          {me &&
            <View style={styles.headerArea}>
              <Text style={styles.name}>
                Yo, {me.name}!
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
                  onPress={e => this.buttonClickHandler(me)}
                  title={me.status ? 'I’m Out' : 'I’m Down'}
                  color='#292C3F'
                  accessibilityLabel='Click this button to let everyone know that your down for gaming tonight'
                />
              </View>
            :
              <View style={styles.button}>
                <Button
                  onPress={e => this.loginUser()}
                  title='Login'
                  color='#292C3F'
                  accessibilityLabel='Click this button to let everyone know that your down for gaming tonight'
                />
              </View>
            }
          </View>

          {/* me &&
            <View style={styles.budsArea}>
              {buds.map(bud => {
                return (
                  <View style={styles.bud} key={bud}>
                    <Text>{bud}</Text>
                  </View>
                )
              })}
            </View>
          */}
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
