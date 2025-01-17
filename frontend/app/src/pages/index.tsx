import React from 'react';
/* eslint-disable func-style */
import '@material/react-material-icon/dist/material-icon.css';
import { AppMode } from 'config';
import { Route, Switch } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import BotsBody from '../bots/Body';
import PeopleHeader from '../people/main/Header';
import TokenRefresh from '../people/utils/TokenRefresh';
import Body from '../tribes/Body';
import Header from '../tribes/Header';
import { MainLayout } from './MainLayout';
import { Modals } from './Modals';
import { People } from './people';
import { TicketsPage } from './tickets';
import { LeaderboardPage } from './leaderboard';

const modeDispatchPages: Record<AppMode, () => React.ReactElement> = {
  community: () => (
    <MainLayout header={<PeopleHeader />}>
      <TokenRefresh />
      <Switch>
        <Route path="/t/">
          <Body />
        </Route>
        <Route path="/b/">
          <BotsBody />
        </Route>
        <Route path="/p/">
          <People />
        </Route>
        <Route path="/bounties/">
          <TicketsPage />
        </Route>
        <Route path="/tickets/">
          <TicketsPage />
        </Route>
        <Route path="/bounty/:bountyId">
          <TicketsPage />
        </Route>
        <Route path="/org/bounties/:uuid">
          <TicketsPage />
        </Route>
        <Route path="/leaderboard">
          <LeaderboardPage />
        </Route>
        <Route path="*">
          <Body />
        </Route>
      </Switch>
    </MainLayout>
  ),
  people: () => <></>,
  tribes: () => (
    <MainLayout header={<Header />}>
      <Body />
    </MainLayout>
  )
};

export const Pages = observer(({ mode }: { mode: AppMode }) => (
  <>
    {modeDispatchPages[mode]()}
    <Modals />
  </>
));
