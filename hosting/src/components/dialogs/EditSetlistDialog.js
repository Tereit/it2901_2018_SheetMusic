import React from 'react';

import {TextField, withStyles} from "material-ui";
import {DatePicker} from "material-ui-pickers"
import AsyncDialog from "./AsyncDialog";

const styles = {
};

class EditSetlistDialog extends React.Component {
    state = {
        title: '',
        date: new Date(),
    };

    componentDidMount() {
        this.props.onRef(this);
    }

    componentWillUnmount() {
        this.props.onRef(undefined)
    }

    async open(setlist) {
        this.setState({title: setlist.title, date: setlist.date});
        await this.dialog.open();
        return {title: this.state.title, date: this.state.date};
    }

    _onTitleInputChange = e => {
        this.setState({title: e.target.value});
    };

    _onDateChange = date => {
        this.setState({date: date});
    };

    render() {
        const {classes} = this.props;
        const {title, date} = this.state;

        return <AsyncDialog title='Edit Setlist' confirmText='Save' onRef={ref => this.dialog = ref}>
            <TextField label='Title' onChange={this._onTitleInputChange} style={{marginBottom: 20}}/>
            <DatePicker
                value={date}
                onChange={this._onDateChange}
            />
        </AsyncDialog>
    }
}

export default withStyles(styles)(EditSetlistDialog);