/* global Stripe */
import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';
import injectTapEventPlugin from 'react-tap-event-plugin';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import getQueryParam from './getQueryParam';
import {Card, CardHeader} from 'material-ui/Card';

injectTapEventPlugin();

// Create a Stripe client
const stripe = Stripe('pk_test_BiJT1O5Jq6UWvHWDlLpwRksl');

// Create an instance of Elements
const elements = stripe.elements();

// Custom styling can be passed to options when creating an Element.
// (Note that this demo uses a wider set of styles than the guide below.)
const style = {
  base: {
    color: '#32325d',
    lineHeight: '24px',
    fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
    fontSmoothing: 'antialiased',
    fontSize: '16px',
    '::placeholder': {
      color: '#aab7c4'
    }
  },
  invalid: {
    color: '#fa755a',
    iconColor: '#fa755a'
  }
};

// Create an instance of the card Element
const card = elements.create('card', {style: style});

class App extends Component {

  constructor() {
    super();
    this.state = {
      amount: null,
      charge: null,
      transfer: null,
      formError: false
    };
  }

  componentDidMount() {
    // Add an instance of the card Element into the `card-element` <div>
    card.mount('#card-element');

    // Handle real-time validation errors from the card Element.
    card.addEventListener('change', (event) => {
      const displayError = document.getElementById('card-errors');
      if (event.error) {
        displayError.textContent = event.error.message;
        this.setState({formError: true});
      } else {
        displayError.textContent = '';
        this.setState({formError: false});
      }
    });
  }

  submitCharge = () => {
    const chargeAmount = this.chargeInput.input.value;
    stripe.createToken(card).then((result) => {
      if (result.error) {
        // Inform the user if there was an error
        var errorElement = document.getElementById('card-errors');
        errorElement.textContent = result.error.message;
      } else {
        // Send the token to your server
        const token = result.token;
        fetch(`http://localhost:3001/api/stripe/charge?amount=${chargeAmount}&token=${token.id}`, {accept: 'application/json', mode: 'cors'}).then((response) => {
          response.json().then(data => {
            if (data.success) {
              this.setState({amount: chargeAmount, charge: data.data});
              localStorage.setItem('amount', chargeAmount);
              localStorage.setItem('chargeId', data.data.id);
            }
          });
        }).catch((err) => {
          console.log(err);
        });
      }
    });
  }

  submitTransfer = () => {
    const amount = localStorage.getItem('amount');
    const chargeId = localStorage.getItem('chargeId');
    fetch(`http://localhost:3001/api/stripe/transfer?amount=${amount}&chargeId=${chargeId}`, {accept: 'application/json', mode: 'cors'}).then((response) => {
      response.json().then(data => {
          if (data.success){
            this.setState({transfer: data.data});
            localStorage.setItem('amount', null);
            localStorage.setItem('chargeId', null);
          }
      });
    }).catch((err) => {
      console.log(err);
    });
  }

  render() {
    const connect = getQueryParam('connect');
    return (
      <MuiThemeProvider>
        <div className="App">
          <div className="App-header">
            <img src={logo} className="App-logo" alt="logo" />
            <h2>Stripe Connect Demo</h2>
          </div>
          <p className="App-intro" />
          <div>
            {localStorage.getItem('amount') && connect &&
              <RaisedButton
                label="Receive Winnings"
                onClick={this.submitTransfer}
              />
            }
            <br /><br />
            {this.state.transfer &&
              <Card style={{width: 500, margin: 'auto'}}>
                <CardHeader
                  className="card-title"
                  title={JSON.stringify(this.state.transfer, null, 10)}
                />
              </Card>
            }
            <br /><br />
          </div>
          {!connect &&
          <div>
            <form id="payment-form" style={{width: 500, margin: 'auto'}}>
              <div className="form-row">
              <label htmlFor="card-element">
                Credit or Debit Card
              </label>
              <br /><br />
              <div id="card-element">
              </div>
              <br />
              <div id="card-errors" role="alert"></div></div>
              <br />
              <TextField type="number" defaultValue='10' floatingLabelText="Enter $ into pot" ref={(input) => { this.chargeInput = input; }} />
              <br/>
              <RaisedButton label='Pay' disabled={this.state.formError} onClick={this.submitCharge} />
            </form>
            <br/><br/>
            {this.state.charge &&
              <div>
              <Card style={{width: 1000, margin: 'auto'}}>
                <CardHeader
                  className="card-title"
                  title={JSON.stringify(this.state.charge, null, 10)}
                />
              </Card>
              <br /><br />
              {this.state.amount &&
                <RaisedButton
                  label="Connect with Stripe"
                  href='https://connect.stripe.com/oauth/authorize?response_type=code&client_id=ca_B2cTTSqNUDbklnO8F49Tll68CUDllize&scope=read_write'
                />
              }
              </div>
            }
          </div>}
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
