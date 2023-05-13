import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import classNames from 'classnames';
import { Trans } from 'react-i18next';
import { clearZoom, navigate, sendGameMessage, zoomCard } from '../../redux/actions';

import PlayerStats from './PlayerStats';
import PlayerRow from './PlayerRow';
import DiceHistory from './DiceHistory';
import ActivePlayerPrompt from './ActivePlayerPrompt';
import CardZoom from './CardZoom';
import CardLog from './CardLog';
import PlayerBoard from './PlayerBoard';
import GameChat from './GameChat';
import GameConfigurationModal from './GameConfigurationModal';
import Droppable from './Droppable';
import TimeLimitClock from './TimeLimitClock';

import './GameBoard.scss';
import PlayerPBRow from './PlayerPBRow';
import ManualCommands from '../../pages/ManualCommands';
import MovablePanel from './MovablePanel';
import CardInspector from './CardInspector';
import Clock from './Clock';
import WinLoseSplash from './WinLoseSplash';
import ChimeraRow from './ChimeraRow';
import DeckNotes from '../../pages/DeckNotes';

const placeholderPlayer = {
    cardPiles: {
        cardsInPlay: [],
        discard: [],
        hand: [],
        purged: [],
        spells: [],
        deck: [],
        archives: []
    },
    activePlayer: false,
    firstPlayer: false,
    numDeckCards: 0,
    actions: {
        main: false,
        side: false
    },
    title: null,
    user: null,
    dice: []
};

const GameBoard = () => {
    const dispatch = useDispatch();
    const [showMessages, setShowMessages] = useState(true);
    const [showDiceHistory, setShowDiceHistory] = useState(false);
    const [showManualCommands, setShowManualCommands] = useState(false);
    const [showDeckNotes, setShowDeckNotes] = useState(false);
    const [showWinSplash, setShowWinSplash] = useState(true);
    const [lastMessageCount, setLastMessageCount] = useState(0);
    const [newMessages, setNewMessages] = useState(0);
    const [showModal, setShowModal] = useState(false);

    const currentGame = useSelector((state) => state.lobby.currentGame);
    const cardSize = useSelector((state) => state.account.user.settings.cardSize);
    const cardToZoom = useSelector((state) => state.cards.zoomCard);
    const cards = useSelector((state) => state.cards.cards);
    const optionSettings = useSelector((state) => state.account.user.settings.optionSettings || {});
    const authUser = useSelector((state) => state.auth.user);
    const user = useSelector((state) => state.account.user);

    const onMouseOver = (card) => {
        dispatch(zoomCard(card));
    };

    const onMouseOut = () => {
        dispatch(clearZoom());
    };

    const onCardClick = (card) => {
        dispatch(sendGameMessage('cardClicked', card.uuid));
    };

    const onCardAltClick = (card) => {
        dispatch(sendGameMessage('cardAltClicked', card.uuid));
    };

    const onDieClick = (die) => {
        dispatch(sendGameMessage('dieClicked', die.uuid));
    };

    const handleDrawPopupChange = (event) => {
        dispatch(sendGameMessage('showDrawDeck', event.visible));
    };

    const sendChatMessage = (message) => {
        dispatch(sendGameMessage('chat', message));
    };

    const onShuffleClick = () => {
        dispatch(sendGameMessage('shuffleDeck'));
    };

    const onPileClick = (source) => {
        dispatch(sendGameMessage('pileClicked', source));
    };

    const onDragDrop = (card, source, target) => {
        dispatch(sendGameMessage('drop', card.uuid, source, target));
    };

    const onCommand = (command, arg, uuid, method) => {
        let commandArg = arg;
        dispatch(sendGameMessage(command, commandArg, uuid, method));
    };

    const onMenuItemClick = (card, menuItem) => {
        dispatch(sendGameMessage('menuItemClick', card.uuid, menuItem));
    };

    const onOptionSettingToggle = (option, value) => {
        dispatch(sendGameMessage('toggleOptionSetting', option, value));
    };

    const onTimerExpired = (uuid) => {
        dispatch(sendGameMessage('menuButton', null, uuid, 'pass'));
    };

    const onClockZero = () => {
        dispatch(sendGameMessage('clockZero'));
    };

    const onMuteClick = () => {
        dispatch(sendGameMessage('toggleMuteSpectators'));
    };

    const onSettingsClick = () => {
        setShowModal(true);
    };

    const onMessagesClick = () => {
        setShowMessages(!showMessages);
        if (showMessages) {
            setNewMessages(0);
            setLastMessageCount(currentGame.messages.length);
        }
    };

    const onDiceHistoryClick = () => {
        setShowDiceHistory(!showDiceHistory);
    };

    const onManualModeClick = (event) => {
        event.preventDefault();
        dispatch(sendGameMessage('toggleManualMode'));
    };

    const onManualCommandsClick = () => {
        setShowManualCommands(!showManualCommands);
    };

    const onDeckNotesClick = () => {
        setShowDeckNotes(!showDeckNotes);
    };

    const onWinSplashCloseClick = () => {
        setShowWinSplash(showWinSplash);
    };

    const defaultPlayerInfo = (source) => {
        let player = Object.assign({}, placeholderPlayer, source);
        player.cardPiles = Object.assign({}, placeholderPlayer.cardPiles, player.cardPiles);
        player.dice = Object.assign([], placeholderPlayer.dice, player.dice);
        return player;
    };

    const getTimer = (player) => {
        let clocks = [];
        if (currentGame.useGameTimeLimit) {
            if (currentGame.gameTimeLimit && currentGame.gameTimeLimitStarted) {
                clocks.push(
                    <TimeLimitClock
                        timeLimitStarted={currentGame.gameTimeLimitStarted}
                        timeLimitStartedAt={currentGame.gameTimeLimitStartedAt}
                        timeLimit={currentGame.gameTimeLimit}
                    />
                );
            }
            if (player.clock) {
                clocks.push(
                    <Clock
                        secondsLeft={player.clock.timeLeft}
                        mode={player.clock.mode}
                        stateId={player.clock.stateId}
                        periods={player.clock.periods}
                        mainTime={player.clock.mainTime}
                        timePeriod={player.clock.timePeriod}
                        winner={currentGame.winner}
                        onClockZero={onClockZero}
                    />
                );
            }
        }
        return <div className='time-limit-clock card bg-dark border-primary'>{clocks}</div>;
    }

    const getPlayerRows = (otherPlayer, compactLayout, leftMode, cardSize, spectating) => {
        return (
            <>
                {!compactLayout && (
                    <div className='player-home-row'>
                        <PlayerRow
                            active={otherPlayer.activePlayer}
                            archives={otherPlayer.cardPiles.archives}
                            cardSize={cardSize}
                            isMe={false}
                            hand={otherPlayer.cardPiles.hand}
                            leftMode={leftMode}
                            manualMode={currentGame.manualMode}
                            onCardClick={onCardClick}
                            onDieClick={onDieClick}
                            onMouseOut={onMouseOut}
                            onMouseOver={onMouseOver}
                            side='top'
                            dice={otherPlayer.dice}
                            purgedPile={otherPlayer.cardPiles.purged}
                            behaviour={otherPlayer.behaviour}
                        />
                    </div>
                )}
                <div className='player-home-row'>
                    <PlayerPBRow
                        active={otherPlayer.activePlayer}
                        cardSize={cardSize}
                        discard={otherPlayer.cardPiles.discard}
                        drawDeck={otherPlayer.cardPiles.deck}
                        isMe={false}
                        manualMode={currentGame.manualMode}
                        numDeckCards={otherPlayer.numDeckCards}
                        onCardClick={onCardClick}
                        onDieClick={onDieClick}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        player={otherPlayer}
                        showDice={compactLayout}
                        showDeckPile={!compactLayout}
                        side='top'
                        spells={otherPlayer.cardPiles.spells}
                        spectating={spectating}
                        phoenixborn={otherPlayer.phoenixborn}
                    />
                </div>
            </>
        );
    }

    const getChimeraRow = (otherPlayer, spectating) => {
        return (
            <div className='player-home-row'>
                <ChimeraRow
                    cardSize={cardSize}
                    dice={otherPlayer.dice}
                    discard={otherPlayer.cardPiles.discard}
                    drawDeck={otherPlayer.cardPiles.deck}
                    isMe={false}
                    manualMode={currentGame.manualMode}
                    numDeckCards={otherPlayer.numDeckCards}
                    onCardClick={onCardClick}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    player={otherPlayer}
                    side='top'
                    spells={otherPlayer.cardPiles.spells}
                    spectating={spectating}
                    phoenixborn={otherPlayer.phoenixborn}
                />
            </div>
        );
    }

    const renderBoard = (
        thisPlayer,
        otherPlayer,
        compactLayout,
        leftMode,
        cardSize,
        spectating
    ) => {
        return [
            <div key='board-middle' className='board-middle'>
                {currentGame.solo
                    ? getChimeraRow(otherPlayer, compactLayout, leftMode, cardSize, spectating)
                    : getPlayerRows(otherPlayer, compactLayout, leftMode, cardSize, spectating)}

                <div className='board-inner'>
                    <div className='play-area'>
                        {/* opponent board */}
                        <PlayerBoard
                            attack={currentGame.attack}
                            cardsInPlay={otherPlayer.cardPiles.cardsInPlay}
                            phoenixborn={otherPlayer.phoenixborn}
                            onCardClick={onCardClick}
                            onMenuItemClick={onMenuItemClick}
                            onMouseOut={onMouseOut}
                            onMouseOver={onMouseOver}
                            rowDirection='reverse'
                            side='top'
                            cardSize={cardSize}
                            playerId={otherPlayer.id}
                            active={otherPlayer.activePlayer}
                        />
                        {/* myboard */}
                        <Droppable
                            onDragDrop={onDragDrop}
                            source='play area'
                            manualMode={currentGame.manualMode}
                        >
                            <PlayerBoard
                                attack={currentGame.attack}
                                cardsInPlay={thisPlayer.cardPiles.cardsInPlay}
                                phoenixborn={thisPlayer.phoenixborn}
                                manualMode={currentGame.manualMode}
                                onCardClick={onCardClick}
                                onMenuItemClick={onMenuItemClick}
                                onMouseOut={onMouseOut}
                                onMouseOver={onMouseOver}
                                rowDirection='default'
                                side='bottom'
                                cardSize={cardSize}
                                playerId={thisPlayer.id}
                                active={thisPlayer.activePlayer}
                            />
                        </Droppable>
                    </div>
                </div>
                <div className='player-home-row our-side'>
                    <PlayerPBRow
                        active={thisPlayer.activePlayer}
                        cardSize={cardSize}
                        discard={thisPlayer.cardPiles.discard}
                        drawDeck={thisPlayer.cardPiles.deck}
                        isMe={!spectating}
                        manualMode={currentGame.manualMode}
                        numDeckCards={thisPlayer.numDeckCards}
                        onCardClick={onCardClick}
                        onCardAltClick={onCardAltClick}
                        onDieClick={onDieClick}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onMenuItemClick={onMenuItemClick}
                        player={thisPlayer}
                        showDice={spectating && compactLayout}
                        showDeckPile={!(spectating && compactLayout)}
                        side='bottom'
                        spells={thisPlayer.cardPiles.spells}
                        spectating={spectating}
                        onDrawPopupChange={handleDrawPopupChange}
                        onPileClick={onPileClick}
                        onShuffleClick={onShuffleClick}
                        onDragDrop={onDragDrop}
                        phoenixborn={thisPlayer.phoenixborn}
                    />
                </div>
                <div className='player-home-row our-side'>
                    {!(spectating && compactLayout) && (
                        <PlayerRow
                            active={thisPlayer.activePlayer}
                            archives={thisPlayer.cardPiles.archives}
                            cardSize={cardSize}
                            isMe={!spectating}
                            hand={thisPlayer.cardPiles.hand}
                            leftMode={leftMode}
                            manualMode={currentGame.manualMode}
                            onCardClick={onCardClick}
                            onCardAltClick={onCardAltClick}
                            onDragDrop={onDragDrop}
                            onMouseOut={onMouseOut}
                            onMouseOver={onMouseOver}
                            onDieClick={onDieClick}
                            onMenuItemClick={onMenuItemClick}
                            side='bottom'
                            dice={thisPlayer.dice}
                            purgedPile={thisPlayer.cardPiles.purged}
                        />
                    )}
                </div>
            </div>
        ];
    };

    // // eslint-disable-next-line camelcase
    // UNSAFE_componentWillReceiveProps(props) {
    //     let lastMessageCount = this.state.lastMessageCount;
    //     let currentMessageCount = props.currentGame ? props.currentGame.messages.length : 0;

    //     if (this.state.showMessages) {
    //         this.setState({ lastMessageCount: currentMessageCount, newMessages: 0 });
    //     } else {
    //         this.setState({ newMessages: currentMessageCount - lastMessageCount });
    //     }
    // }

    if (Object.values(cards).length === 0 || !currentGame?.started) {
        return (
            <div>
                <Trans>Waiting for server...</Trans>
            </div>
        );
    }

    if (!authUser) {
        dispatch(navigate('/'));
        return (
            <div>
                <Trans>You are not logged in, redirecting...</Trans>
            </div>
        );
    }

    let spectating = !currentGame.players[user.username];
    let thisPlayer = currentGame.players[user.username];
    if (!thisPlayer) {
        thisPlayer = Object.values(currentGame.players)[0];
    }

    if (!thisPlayer) {
        return (
            <div>
                <Trans>Waiting for game to have players or close...</Trans>
            </div>
        );
    }

    let otherPlayer = Object.values(currentGame.players).find((player) => {
        return player.name !== thisPlayer.name;
    });

    // Default any missing information
    thisPlayer = defaultPlayerInfo(thisPlayer);
    otherPlayer = defaultPlayerInfo(otherPlayer);

    let boardClass = classNames('game-board', {
        'select-cursor': thisPlayer && thisPlayer.selectCard
    });

    let manualMode = currentGame.manualMode;
    const compactLayout = optionSettings?.compactLayout;
    const leftMode = optionSettings?.leftMode;

    const getOtherPlayerPrompt = (otherPlayer) => {
        let otherPlayerPrompt = null;
        if (currentGame.solo) {
            const otherState = otherPlayer.promptState;
            otherState.style = 'warning';
            otherPlayerPrompt = (
                <div className='inset-pane'>
                    <ActivePlayerPrompt
                        cards={cards}
                        promptState={otherState}
                        onButtonClick={onCommand}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onTimerExpired={onTimerExpired.bind(this)}
                        phase={currentGame.currentPhase}
                    />
                </div>
            );
        }
        return otherPlayerPrompt;
    };

    const getCardLog = () => {
        return (
            <div className='timer-log-area'>
                <CardLog
                    items={currentGame.cardLog}
                    onMouseOut={onMouseOut}
                    onMouseOver={onMouseOver}
                />
            </div>
        );
    };

    const getPromptArea = (thisPlayer) => {
        let otherPlayerPrompt = null;
        const logArea = thisPlayer.inspectionCard ? (
            <CardInspector card={thisPlayer.inspectionCard} />
        ) : (
            <div>{otherPlayerPrompt || getCardLog()}</div>
        );
        return (
            <div className='prompt-area panel'>
                {logArea}
                <div className='inset-pane'>
                    <ActivePlayerPrompt
                        cards={cards}
                        promptState={thisPlayer.promptState}
                        onButtonClick={onCommand}
                        onMouseOver={onMouseOver}
                        onMouseOut={onMouseOut}
                        onTimerExpired={onTimerExpired}
                        phase={currentGame.currentPhase}
                    />
                    {getTimer(thisPlayer)}
                </div>
            </div>
        );
    }

    return (
        <div className={boardClass}>
            {showModal && (
                <GameConfigurationModal
                    optionSettings={thisPlayer.optionSettings}
                    onOptionSettingToggle={onOptionSettingToggle}
                    onClose={() => setShowModal(false)}
                />
            )}
            <div className='stats-top'>
                <PlayerStats
                    stats={otherPlayer.stats}
                    activePlayer={otherPlayer.activePlayer}
                    actions={otherPlayer.actions}
                    compactLayout={compactLayout}
                    firstPlayer={otherPlayer.firstPlayer}
                    phoenixborn={otherPlayer.phoenixborn}
                    player={otherPlayer}
                    clockState={otherPlayer.clock}
                    winner={currentGame.winner}
                    onCardClick={onCardClick}
                    onMouseOver={onMouseOver}
                    solo={currentGame.solo}
                />
            </div>
            <div className='main-window'>
                {leftMode && getPromptArea(thisPlayer)}
                {renderBoard(
                    thisPlayer,
                    otherPlayer,
                    compactLayout,
                    leftMode,
                    cardSize,
                    spectating
                )}
                {showWinSplash && currentGame.winner && (
                    <WinLoseSplash game={currentGame} onCloseClick={onWinSplashCloseClick} />
                )}
                {!thisPlayer.inspectionCard && cardToZoom && (
                    <CardZoom
                        cardName={cardToZoom ? cardToZoom.name : null}
                        card={cardToZoom}
                        left={leftMode}
                    />
                )}
                {showManualCommands && (
                    <div className='info-panel'>
                        <MovablePanel
                            title='Manual Commands'
                            name='Manual'
                            onCloseClick={onManualCommandsClick}
                            side='bottom'
                        >
                            <ManualCommands />
                        </MovablePanel>
                    </div>
                )}
                {showDeckNotes && thisPlayer.deckNotes && (
                    <div className='info-panel'>
                        <MovablePanel
                            title='Deck Notes'
                            name='Notes'
                            onCloseClick={onDeckNotesClick}
                            side='bottom'
                        >
                            <DeckNotes notes={thisPlayer.deckNotes} />
                        </MovablePanel>
                    </div>
                )}
                {showDiceHistory && (
                    <div>
                        <DiceHistory
                            firstFive={thisPlayer.firstFive}
                            diceHistory={thisPlayer.diceHistory}
                            onCloseClick={onDiceHistoryClick}
                            side='bottom'
                        />
                    </div>
                )}
                <div className='right-side'>
                    {!leftMode && getPromptArea(thisPlayer)}

                    {showMessages && (
                        <div className='gamechat'>
                            {getOtherPlayerPrompt(otherPlayer)}
                            <GameChat
                                key='gamechat'
                                messages={currentGame.messages}
                                onCardMouseOut={onMouseOut}
                                onCardMouseOver={onMouseOver}
                                onSendChat={sendChatMessage}
                                muted={spectating && currentGame.muteSpectators}
                            />
                        </div>
                    )}
                </div>
            </div>
            <div>
                <PlayerStats
                    activePlayer={thisPlayer.activePlayer}
                    actions={thisPlayer.actions}
                    clockState={thisPlayer.clock}
                    compactLayout={spectating && compactLayout}
                    firstPlayer={thisPlayer.firstPlayer}
                    isMe={!spectating}
                    manualModeEnabled={manualMode}
                    muteSpectators={currentGame.muteSpectators}
                    numMessages={newMessages}
                    onDeckNotesClick={onDeckNotesClick}
                    onDiceHistoryClick={onDiceHistoryClick}
                    onDragDrop={onDragDrop}
                    onManualCommandsClick={onManualCommandsClick}
                    onManualModeClick={onManualModeClick}
                    onCardClick={onCardClick}
                    onCardAltClick={onCardAltClick}
                    onDieClick={onDieClick}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    onMenuItemClick={onMenuItemClick}
                    onMessagesClick={onMessagesClick}
                    onMuteClick={onMuteClick}
                    onSettingsClick={onSettingsClick}
                    phoenixborn={thisPlayer.phoenixborn}
                    player={thisPlayer}
                    showControls={!spectating && manualMode}
                    showManualMode={!spectating}
                    showMessages
                    size={cardSize}
                    stats={thisPlayer.stats}
                    winner={currentGame.winner}
                />
            </div>
        </div>
    );

    // function mapStateToProps(state) {
    //     return {
    //         cardToZoom: state.cards.zoomCard,
    //         cards: state.cards.cards,
    //         currentGame: state.lobby.currentGame,
    //         packs: state.cards.packs,
    //         restrictedList: state.cards.restrictedList,
    //         socket: state.lobby.socket,
    //         user: state.account.user,
    //         authUser: state.auth.user,
    //         // using ACCOUNT for temporary settings access
    //         optionSettings: state.account.user.settings.optionSettings || {}
    //     };
    // }

    // function mapDispatchToProps(dispatch) {
    //     let boundActions = bindActionCreators(actions, dispatch);
    //     boundActions.dispatch = dispatch;

    //     return boundActions;
    // }
};

PlayerStats.displayName = 'GameBoard';

export default GameBoard;
