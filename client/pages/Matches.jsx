import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import moment from 'moment';

import AlertPanel from '../Components/Site/AlertPanel';
import Panel from '../Components/Site/Panel';
import * as actions from '../redux/actions';

import { withTranslation, Trans } from 'react-i18next';

class Matches extends React.Component {
    componentDidMount() {
        this.props.loadUserGames();
    }

    computeWinner(game) {
        if (
            !game.winner ||
            game.winner === game.players[0].name ||
            game.winner === game.players[1].name
        ) {
            return game.winner;
        }

        if (game.winner === game.players[0].deck) {
            return game.players[0].name;
        }

        if (game.winner === game.players[1].deck) {
            return game.players[1].name;
        }
    }

    render() {
        const gameApiRoot = `${window.location.protocol}//${window.location.host}/api/game/`;

        let content = null;

        if (this.props.apiLoading) {
            content = (
                <div>
                    <Trans>Loading games from the server...</Trans>
                </div>
            );
        } else if (!this.props.apiSuccess) {
            content = <AlertPanel type='error' message={this.props.apiMessage} />;
        } else {
            let myGames = this.props.games
                ? this.props.games.map((game) => {
                    var startedAt = moment(game.startedAt);
                    var finishedAt = moment(game.finishedAt);
                    var duration = moment.duration(finishedAt.diff(startedAt));

                    return (
                        <tr key={game.gameId}>
                            <td>
                                {moment(game.startedAt).format('YYYY-MM-DD HH:mm')}
                            </td>
                            <td>{game.players[0].deck}</td>
                            <td style={{ 'white-space': 'nowrap' }}>{game.players[1].name}<br />
                                {game.players[1].deck}</td>
                            <td>{this.computeWinner(game)}<br />({game.winReason})</td>
                            <td style={{ 'white-space': 'nowrap' }}>{game.gameType === 'competitive' ? 'Y' : ''}</td>
                            <td style={{ 'white-space': 'nowrap' }}>
                                <a href={gameApiRoot + game.gameId} download={true}>
                                    {game.gameId}
                                </a>
                                <br />
                                {duration.get('minutes')}m {duration.get('seconds')}s
                            </td>
                        </tr>
                    );
                })
                : null;

            let table =
                this.props.games && this.props.games.length === 0 ? (
                    <div>You have no recorded games.</div>
                ) : (
                    <table className='table table-striped'>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>
                                    <Trans>My Deck</Trans>
                                </th>
                                <th>
                                    <Trans>Opponent</Trans>
                                </th>
                                <th>
                                    <Trans>Winner</Trans>
                                </th>
                                <th>
                                    <Trans>Ranked</Trans>
                                </th>
                                <th>
                                    <Trans>details</Trans>
                                </th>
                            </tr>
                        </thead>
                        <tbody>{myGames}</tbody>
                    </table>
                );

            content = (
                <div className='col-sm-offset-1 profile full-height'>
                    <Panel title={'My Games'}>{table}</Panel>
                </div>
            );
        }

        return content;
    }
}

Matches.displayName = 'Matches';
Matches.propTypes = {
    apiLoading: PropTypes.bool,
    apiMessage: PropTypes.string,
    apiSuccess: PropTypes.bool,
    games: PropTypes.array,
    i18n: PropTypes.object,
    loadUserGames: PropTypes.func,
    loading: PropTypes.bool,
    t: PropTypes.func
};

function mapStateToProps(state) {
    return {
        apiLoading: state.api.REQUEST_USERGAMES ? state.api.REQUEST_USERGAMES.loading : undefined,
        apiMessage: state.api.REQUEST_USERGAMES ? state.api.REQUEST_USERGAMES.message : undefined,
        apiSuccess: state.api.REQUEST_USERGAMES ? state.api.REQUEST_USERGAMES.success : undefined,
        games:
            state.games &&
            state.games.games &&
            state.games.games.filter(
                (game) =>
                    game.players &&
                    game.players.length === 2
            ),
        loading: state.api.loading
    };
}

export default withTranslation()(connect(mapStateToProps, actions)(Matches));
