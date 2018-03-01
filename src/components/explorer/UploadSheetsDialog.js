import React, {Component} from 'react';
import {
    AppBar, Button, Chip, CircularProgress, Collapse, Dialog, Drawer, IconButton, List, ListItem, ListItemText,
    ListSubheader, Paper, Slide,
    Snackbar, Toolbar,
    Typography
} from "material-ui";

import {withStyles} from "material-ui/styles";

import Selectable from "../Selectable";

import firebase from 'firebase';

import {
    ExpandLess, ChevronRight, Add, Close, Assistant, ExpandMore, ArrowBack, Home, Remove,
    Delete
} from "material-ui-icons";
import Draggable from "../Draggable";


const drawerWidth = 240;

const styles = {
    root: {},

    flex: {
        flex: 1
    },

    appBar: {
        zIndex: 10000,
    },

    sheetContainer: {
        display: 'flex',
        paddingTop: 10,
        paddingLeft: 10,
        flexWrap: 'wrap',
        overflowY: 'auto',
        height: 'calc(100% - 45px)',
        boxSizing: 'border-box'
    },

    selectable: {
        height: 170,
        width: 220,
        marginRight: 10,
        marginBottom: 10
    },

    content: {
        paddingTop: 64 + 20,
        paddingLeft: 20,
        paddingRight: 20,
        paddingBottom: 20,
        height: '100%',
        background: 'rgb(250, 250, 250)',
        boxSizing: 'border-box'
    },

    paper: {
        display: 'flex',
        height: '100%'
    },

    chip: {
        marginRight: 10,
        marginBottom: 10
    },

    drawer__paper: {
        width: drawerWidth
    },

    drawerContent: {
        paddingTop: 64,
    },

    uploadPane: {
        flex: 1,
        overflowY: 'auto',
        borderRight: '1px solid rgba(0,0,0,0.12)',
    },

    explorerPane: {
        width: '400px'
    },

    paneHeader: {
        height: 44,
        background: 'rgb(245, 245, 245)',
        borderBottom: '1px solid rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px'
    },

    anchor: {
        textDecoration: 'underline',
        cursor: 'pointer',
        color: 'rgb(0,188,212)'
    }

};

function Transition(props) {
    return <Slide direction="up" {...props} />;
}

class UploadSheetsDialog extends Component {
    state = {
        sheets: [],
        groups: [],
        instruments: [],
        selectedScore: null,
        selectedInstrument: null,
        lastClicked: null
    };

    keys = {};

    constructor(props) {
        super(props);

        window.onkeydown = e => {
            this.keys[e.code] = true;
        };

        window.onkeyup = e => {
            this.keys[e.code] = false;
        }
    }

    _onDialogClose() {
        this.setState({sheets: []});
        this.props.onClose();
    }

    _onSelectFileClick() {
        this.fileBrowser.click();
    }

    async _onFileChange(e) {
        // https://reactjs.org/docs/events.html#event-pooling
        e.persist();

        if (!e.target.files.length) return;

        const PDFJS = await import('pdfjs-dist');

        let reader = new FileReader();

        reader.addEventListener('load', async () => {
            let pdf = await PDFJS.getDocument(new Uint8Array(reader.result));

            let images = await Promise.all([...Array(pdf.numPages).keys()].map(async n => {
                let page = await pdf.getPage(n + 1);

                let viewport = page.getViewport(2);

                let canvas = document.createElement("canvas");
                let context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                let task = page.render({canvasContext: context, viewport: viewport});

                await task.promise;

                return canvas.toDataURL();
            }));


            this.setState({sheets: images.map((image, index) => ({image: image, selected: false, index: index}))});
        });

        reader.readAsArrayBuffer(e.target.files[0]);
    }

    _onDraggableClick(e, index) {
        e.stopPropagation();

        let sheets = [...this.state.sheets];

        if (this.keys.MetaLeft) {
            sheets[index].selected = !sheets[index].selected;
        } else if (this.keys.ShiftLeft && this.state.lastClicked !== null) {
            let indices = [];
            for (let i = Math.min(this.state.lastClicked, index); i <= Math.max(this.state.lastClicked, index); i++) {
                indices.push(i);
            }

            for (let i of indices) {
                sheets[i].selected = true;
            }
        } else {
            for (let sheet of sheets) {
                sheet.selected = false;
            }
            sheets[index].selected = true;
        }

        this.setState({sheets: sheets, lastClicked: index});
    }

    _onScoreClick(score) {
        this.setState({selectedScore: score});
    }

    _onDragStart(e) {
        const image = new Image();
        e.dataTransfer.setDragImage(image, 0, 0);
    }

    _onListItemDrop = (e, sheetMusic) => {
        this.props.onUploadSheets(
            this.state.selectedScore.id,
            sheetMusic.id,
            this.state.sheets.filter(sheet => sheet.selected).map(sheet => sheet.image));
    };

    _onInstrumentClick(s) {
        this.setState({selectedInstrument: s})
    }

    _onSheetDelete() {

    }

    _onUploadPaneClick = () => {
        this.setState({sheets: this.state.sheets.map(sheet => ({...sheet, selected: false}))});
    };

    _onBreadcrumbScoreClick = () => {
        this.setState({selectedInstrument: null});
    };

    _onBreadcrumbHomeClick = () => {
        this.setState({selectedInstrument: null, selectedScore: null});
    };

    render() {
        const {classes, band, open} = this.props;
        const {sheets, selectedScore, selectedInstrument} = this.state;

        return <Dialog
            fullScreen
            open={open}
            onClose={() => this._onDialogClose()}
            transition={Transition}
        >
            <AppBar className={classes.appBar}>
                <Toolbar>
                    <IconButton color="inherit" onClick={() => this._onDialogClose()}>
                        <Close/>
                    </IconButton>
                    <Typography variant="title" color="inherit" className={classes.flex}>
                        Upload sheets
                    </Typography>
                    <Button color="inherit" onClick={() => this._onSelectFileClick()}>
                        Add Sheets
                    </Button>
                </Toolbar>
            </AppBar>
            <div className={classes.content}>
                <Paper className={classes.paper} elevation={1}>
                    <div className={classes.uploadPane} onClick={this._onUploadPaneClick}>
                        <div className={classes.paneHeader}>
                            <Typography variant='body1'>
                                Unsorted Sheets
                            </Typography>
                            <div className={classes.flex}/>
                            {sheets.some(sheet => sheet.selected) &&
                                <IconButton onClick={() => this._onSheetDelete()}><Delete/></IconButton>
                            }
                        </div>
                        <div className={classes.sheetContainer}>
                            {sheets.map(sheet =>
                                <Draggable
                                    onDragStart={e => this._onDragStart(e)}
                                    classes={{root: classes.selectable}}
                                    key={sheet.index}
                                    imageURL={sheet.image}
                                    selected={sheet.selected}
                                    onClick={e => this._onDraggableClick(e, sheet.index)}
                                />)}
                        </div>
                    </div>
                    <div className={classes.explorerPane}>
                        <div className={classes.paneHeader}>
                            <Typography variant='body1'>
                                <span className={classes.anchor} onClick={this._onBreadcrumbHomeClick}>Scores</span>
                                {selectedScore && <span> › <span className={classes.anchor} onClick={this._onBreadcrumbScoreClick}>{selectedScore.title}</span></span>}
                                {selectedScore && selectedInstrument &&
                                <span> › {selectedInstrument.instrument.name}</span>
                                }
                            </Typography>
                            <div className={classes.flex}/>
                        </div>
                        <div style={{borderBottom: '1px solid rgba(0,0,0,0.12)'}}>
                            {
                                !selectedScore &&
                                <Button fullWidth color='primary' onClick={() => this.props.onAddScore()}>
                                    ADD SCORE
                                </Button>
                            }
                            {
                                selectedScore && !selectedInstrument &&
                                <Button fullWidth color='primary'
                                        onClick={() => this.props.onAddInstrument(selectedScore.id)}>
                                    ADD INSTRUMENTS
                                </Button>
                            }
                        </div>

                        {
                            !selectedScore && !selectedInstrument &&
                            <List>
                                {band.scores && band.scores.map((score, index) =>
                                    <ListItem key={index} button onClick={() => this._onScoreClick(score)}>
                                        <ListItemText primary={`${score.title} - ${score.composer}`}/>
                                    </ListItem>
                                )}
                            </List>
                        }

                        {
                            selectedScore && !selectedInstrument &&
                            <List>
                                {selectedScore.sheetMusic && selectedScore.sheetMusic.map((s, index) =>
                                    <div
                                        key={index}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={e => this._onListItemDrop(e, s)}
                                    >
                                        <ListItem button key={index} onClick={() => this._onInstrumentClick(s)}>
                                            <ListItemText
                                                primary={`${s.instrument.name} ${s.instrumentNumber > 0 ? s.instrumentNumber : ''}`}/>
                                            {s.uploading && <CircularProgress size={24}/>}
                                            {!s.uploading && <Typography variant='body1'>{s.sheets ? s.sheets.length : 0}</Typography>}
                                        </ListItem>
                                    </div>
                                )}
                            </List>
                        }

                        {
                            selectedScore && selectedInstrument && selectedInstrument.sheets.map((sheet, index) =>
                                <div key={index} style={{
                                    width: '100%',
                                    height: 100,
                                    backgroundImage: `url(${sheet})`,
                                    backgroundSize: '100% auto'
                                }}/>
                            )
                        }
                    </div>
                </Paper>
            </div>
            <input
                ref={input => this.fileBrowser = input}
                type='file'
                style={{display: 'none'}}
                onChange={e => this._onFileChange(e)}
            />
        </Dialog>;
    }
}

export default withStyles(styles)(UploadSheetsDialog);