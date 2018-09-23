import React, { Component } from "react";
import styled from "styled-components";
import BaseLayout from "./components/BaseLayout";
import AssetRow from "./components/AssetRow";
import Button from "./components/Button";
import Column from "./components/Column";
import { fonts } from "./styles";
import {
  walletConnectInitSession,
  walletConnectGetAccounts,
  walletConnectResetSession
} from "./helpers/walletconnect";
import { apiGetAccountBalances } from "./helpers/api";
import { parseAccountBalances } from "./helpers/parsers";

const StyledLanding = styled(Column)`
  height: 600px;
`;

const StyledButtonContainer = styled(Column)`
  width: 250px;
  margin: 50px 0;
`;

const StyledConnectButton = styled(Button)`
  border-radius: 8px;
  font-size: ${fonts.size.medium};
  height: 44px;
  width: 100%;
  margin: 12px 0;
`;

const StyledBalances = styled(StyledLanding)`
  padding-top: 60px;
`;

class App extends Component {
  state = {
    fetching: false,
    network: "mainnet",
    showModal: false,
    uri: "",
    accounts: [],
    address: "",
    assets: []
  };

  toggleModal = async () => {
    await this.setState({ showModal: !this.state.showModal });
    if (!this.state.showModal) {
      await this.setState({ uri: "" });
      if (!this.state.accounts.length) {
        walletConnectResetSession();
      }
    }
  };

  _walletConnectInit = async () => {
    await this.setState({ fetching: true });

    const session = await walletConnectInitSession(); // Initiate session

    await this.setState({ fetching: false });

    let accounts = null;

    if (session) {
      if (session.new) {
        const { uri } = session; // Display QR code with URI string

        await this.setState({ uri });
        this.toggleModal();
        const result = await walletConnectGetAccounts(); // Get wallet accounts
        if (result) {
          accounts = result.accounts;
        }
      } else {
        accounts = session.accounts; // Get wallet accounts
      }
    }

    if (accounts && accounts.length) {
      if (this.state.showModal) {
        this.toggleModal();
      }
      const { network } = this.state;
      const address = accounts[0];
      const { data } = await apiGetAccountBalances(address, network);
      const assets = parseAccountBalances(data);
      await this.setState({ accounts, address, assets });
    } else {
    }
  };

  render = () => (
    <BaseLayout
      address={this.state.address}
      uri={this.state.uri}
      showModal={this.state.showModal}
      toggleModal={this.toggleModal}
    >
      {!this.state.address && !this.state.assets.length ? (
        <StyledLanding center>
          <h2>Check your Ether & Token balances</h2>
          <StyledButtonContainer>
            <StyledConnectButton
              left
              color="walletconnect"
              onClick={this._walletConnectInit}
              fetching={this.state.fetching}
            >
              {"Connect to WalletConnect"}
            </StyledConnectButton>
          </StyledButtonContainer>
        </StyledLanding>
      ) : (
        <StyledBalances>
          <h3>Balances</h3>
          <Column center>
            {this.state.assets.map(asset => (
              <AssetRow key={asset.symbol} asset={asset} />
            ))}
          </Column>
        </StyledBalances>
      )}
    </BaseLayout>
  );
}

export default App;
