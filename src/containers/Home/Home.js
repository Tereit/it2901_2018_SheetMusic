import React, {Component} from 'react';
import {compose} from 'redux';
import {connect} from 'react-redux';
import {withStyles} from 'material-ui/styles';

import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Typography from 'material-ui/Typography';

import {push} from 'react-router-redux';

import {
    Button, Card, CardContent, CardMedia, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Menu, MenuItem,
    TextField
} from "material-ui";
import AddIcon from 'material-ui-icons/Add';
import MenuIcon from 'material-ui-icons/Menu';

import firebase from 'firebase';

const getBands = (userId) => async dispatch => {
    let snapshot = await firebase.firestore().collection(`users/${userId}/bands`).get();
    let bands = await Promise.all(snapshot.docs.map(async doc => {
        const bandDoc = await doc.data().ref.get();
        return {id: bandDoc.id, ...bandDoc.data()};
    }));

    dispatch({type: 'BANDS_FETCH_RESPONSE', bands: bands})
};

const addBand = name => async (dispatch, getState) => {
    let userId = getState().default.user.uid;

    try {
        const band = {
            name: name,
            creator: firebase.firestore().doc(`users/${userId}`),
            code: Math.random().toString(36).substring(7, 12)
        };

        let ref = await firebase.firestore().collection('bands').add(band);
        await firebase.firestore().collection(`users/${userId}/bands`).add({ref: firebase.firestore().doc(`bands/${ref.id}`)});

        dispatch({type: 'BAND_ADD_SUCCESS', band: {id: ref.id, ...band}});
    } catch (err) {
        dispatch({type: 'BAND_ADD_FAILURE'});
    }
};

const joinBand = code => async (dispatch, getState) => {
    let userId = getState().default.user.uid;

    let snapshot = await firebase.firestore().collection('bands').where('code', '==', code).get();

    if (snapshot.docs.length > 0) {
        let docRef = firebase.firestore().doc(`bands/${snapshot.docs[0].id}`);

        await firebase.firestore().collection(`users/${userId}/bands`).add({ref: docRef});

        let doc = await docRef.get();

        dispatch({type: 'BAND_JOIN_SUCCESS', band: {id: doc.id, ...doc.data()}});
    } else {
        dispatch({type: 'BAND_JOIN_FAILURE'});
    }
};

const styles = {
    root: {
    },
    flex: {
        flex: 1
    },
    card: {
        width: 300,
        marginRight: 24,
        marginBottom: 24,
        cursor: 'pointer'
    },
    media: {
        height: 200,
    },
    grid: {
        display: 'flex',
        flexWrap: 'wrap',
        padding: 24
    }
};


class Home extends Component {
    state = {
        anchorEl: null,
        createDialogOpen: false,
        joinDialogOpen: false,
        bandName: '',
        bandCode: ''
    };

    requestBands(user=this.props.user) {
        this.props.dispatch(getBands(user.uid));
    }

    componentWillMount() {
        if (this.props.user) {
            this.requestBands();
        }
    }

    componentWillReceiveProps(props) {
        if (!this.props.user && props.user) {
            this.requestBands(props.user);
        }
    }

    _onAddButtonClick(e) {
        this.setState({anchorEl: e.currentTarget});
    }

    _onMenuClose() {
        this.setState({anchorEl: null});
    }

    _onMenuClick(type) {
        this.setState({[`${type}DialogOpen`]: true});
        this.setState({anchorEl: null});
    }

    _onDialogClose(type) {
        this.setState({[`${type}DialogOpen`]: false});
    }

    _onDialogSubmit(type) {
        switch (type) {
            case 'create':
                this.props.dispatch(addBand(this.state.bandName));
                break;
            case 'join':
                this.props.dispatch(joinBand(this.state.bandCode));
                break;
            default:
                break;
        }

        this.setState({[`${type}DialogOpen`]: false});
    }

    _onMenuButtonClick() {

    }

    render() {
        const {anchorEl, createDialogOpen, joinDialogOpen} = this.state;
        const {classes, bands = []} = this.props;

        return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Toolbar>
                        <IconButton color="inherit" onClick={() => this._onMenuButtonClick()}>
                            <MenuIcon/>
                        </IconButton>
                        <Typography variant="title" color="inherit" className={classes.flex}>
                            ScoreButler
                        </Typography>
                        <IconButton color="inherit" onClick={e => this._onAddButtonClick(e)}>
                            <AddIcon/>
                        </IconButton>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={() => this._onMenuClose()}
                        >
                            <MenuItem onClick={() => this._onMenuClick('create')}>Create Band</MenuItem>
                            <MenuItem onClick={() => this._onMenuClick('join')}>Join Band</MenuItem>
                        </Menu>
                    </Toolbar>
                </AppBar>
                <div className={classes.grid}>
                    {bands.map((band, index) =>
                        <Card key={index} className={classes.card} onClick={() => this.props.dispatch(push(`/band/${band.id}`))} elevation={1}>
                            <CardMedia
                                className={classes.media}
                                image="https://4.bp.blogspot.com/-vq0wrcE-1BI/VvQ3L96sCUI/AAAAAAAAAI4/p2tb_hJnwK42cvImR4zrn_aNly7c5hUuQ/s1600/BandPeople.jpg"
                                title=""
                            />
                            <CardContent>
                                <Typography variant="headline" component="h2">
                                    {band.name}
                                </Typography>
                                <Typography component="p">
                                    Ba. ha ba ba. Ha ba ba ga da.
                                </Typography>
                            </CardContent>
                        </Card>
                    )}
                </div>
                <Dialog open={createDialogOpen} onClose={() => this._onDialogClose('create')}>
                    <DialogTitle>Create Band</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Name"
                            margin="normal"
                            onChange={e => this.setState({bandName: e.target.value})}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button color="primary" onClick={() => this._onDialogClose('create')}>Cancel</Button>
                        <Button color="primary" onClick={() => this._onDialogSubmit('create')} autoFocus>Create</Button>
                    </DialogActions>
                </Dialog>

                <Dialog open={joinDialogOpen} onClose={() => this._onDialogClose('join')}>
                    <DialogTitle>Join Band</DialogTitle>
                    <DialogContent>
                        <TextField
                            label="Code"
                            margin="normal"
                            onChange={e => this.setState({bandCode: e.target.value})}
                        />
                    </DialogContent>
                    <DialogActions>
                        <Button color="primary" onClick={() => this._onDialogClose('join')}>Cancel</Button>
                        <Button color="primary" onClick={() => this._onDialogSubmit('join')} autoFocus>Join</Button>
                    </DialogActions>
                </Dialog>
            </div>
        );
    }
}


export default compose(connect(state => ({
    user: state.default.user,
    bands: state.default.bands
})), withStyles(styles))(Home);