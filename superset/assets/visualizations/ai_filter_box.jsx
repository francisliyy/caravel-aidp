// JS
const $ = require('jquery');
import d3 from 'd3';

import React from 'react';
import ReactDOM from 'react-dom';

import Select from 'react-select';
import '../stylesheets/react-select/select.less';

import './filter_box.css';
import { TIME_CHOICES } from './constants.js';

const propTypes = {
  origSelectedValues: React.PropTypes.object,
  filtersChoices: React.PropTypes.object,
  onChange: React.PropTypes.func,
  showDateFilter: React.PropTypes.bool,
  widget: React.PropTypes.string,
};

const defaultProps = {
  origSelectedValues: {},
  onChange: () => {},
  showDateFilter: false,
};

class FilterBox extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedValues: props.origSelectedValues,
    };
  }
  changeFilter(filter, options) {
    console.log('filter: ' + filter + ', options: ' + options);
    let vals = null;
    if (options) {
      if (Array.isArray(options)) {
        vals = options.map((opt) => opt.value);
      } else {
        vals = options.value;
      }
    }
    console.log('this.state.selectedValues: ' + JSON.stringify(this.state.selectedValues));
    const selectedValues = Object.assign({}, this.state.selectedValues);
    selectedValues[filter] = vals;
    this.setState({ selectedValues });
    this.props.onChange(filter, vals);
  }

  handleClick(filter, e) {
    const clickedValue = e.target.value;
    const input_type = e.target.type;

    const selectedValues = Object.assign({}, this.state.selectedValues);
    let vars = selectedValues[filter];
    if (vars == null) {
      vars = [];
    }

    if (input_type == 'radio') {
      vars = [];
    }
    
    if (vars.includes(clickedValue)) {
      var index = vars.indexOf(clickedValue);
      vars.splice(index, 1);
    } else {
      vars.push(clickedValue);
    }
    console.log('vals' + JSON.stringify(vars));
    selectedValues[filter] = vars;
    this.setState({ selectedValues });
    this.props.onChange(filter, vars);
  }

  renderCheckBox(filter) {
    const data = this.props.filtersChoices[filter];
    console.log('options: ' + this.props.options + JSON.stringify(this.props.options));
    console.log('this.state.selectedValues' + JSON.stringify(this.state.selectedValues));
    let checkboxs = data.map((opt, i) => {
      return (
        <label key = {i}>
          <input onClick={this.handleClick.bind(this, filter)} type='checkbox' name={filter}
               value={opt.id} ref={opt.id} checked={this.state.selectedValues[filter] != null && this.state.selectedValues[filter].includes(opt.id)}/> {opt.text}
        </label>
      );
    });
    return (
      <div className='checkbox'>
          {checkboxs}
      </div>
    );
  }

  renderRadio(filter) {
    const data = this.props.filtersChoices[filter];
    console.log('options: ' + this.props.options + JSON.stringify(this.props.options));
    let checkboxs = data.map((opt, i) => {
      return (
        <label key = {i}>
          <input onClick={this.handleClick.bind(this, filter)} type='radio' name={filter}
               value={opt.id} ref={opt.id} checked={this.state.selectedValues[filter] != null && this.state.selectedValues[filter].includes(opt.id)}/> {opt.text}
        </label>
      );
    });
    return (
      <div className='radio'>
          {checkboxs}
      </div>
    );
  }

  renderSelect(filter) {
    const data = this.props.filtersChoices[filter];
    const maxes = {};
    maxes[filter] = d3.max(data, function (d) {
      return d.metric;
    });
    return (
      <Select
        placeholder={`Select [${filter}]`}
        key={filter}
        multi = {this.props.widget == 'select_multi'}
        value={this.state.selectedValues[filter]}
        options={data.map((opt) => {
          const perc = Math.round((opt.metric / maxes[opt.filter]) * 100);
          const backgroundImage = (
            'linear-gradient(to right, lightgrey, ' +
            `lightgrey ${perc}%, rgba(0,0,0,0) ${perc}%`
          );
          const style = {
            backgroundImage,
            padding: '2px 5px',
          };
          return { value: opt.id, label: opt.id, style };
        })}
        onChange={this.changeFilter.bind(this, filter)}
      />
    )
  }

  render() {
    let dateFilter;
    if (this.props.showDateFilter) {
      dateFilter = ['__from', '__to'].map((field) => {
        const val = this.state.selectedValues[field];
        const choices = TIME_CHOICES.slice();
        if (!choices.includes(val)) {
          choices.push(val);
        }
        const options = choices.map((s) => ({ value: s, label: s }));
        return (
          <div className="m-b-5">
            {field.replace('__', '')}
            <Select.Creatable
              options={options}
              value={this.state.selectedValues[field]}
              onChange={this.changeFilter.bind(this, field)}
            />
          </div>
        );
      });
    }
    const filters = Object.keys(this.props.filtersChoices).map((filter) => {
      // const data = this.props.filtersChoices[filter];
      // const maxes = {};
      // maxes[filter] = d3.max(data, function (d) {
      //   return d.metric;
      // });
      return (
        <div key={filter} className="m-b-5">
          {filter}
          {(() => {
              switch (this.props.widget) {
                case "select_multi":
                case "select_single": return this.renderSelect(filter);
                case "checkbox":  return this.renderCheckBox(filter);
                case "radio": return this.renderRadio(filter);
                default:      return this.renderSelect(filter);
              }
            })()
          }
        </div>
      );
    });
    return (
      <div>
        {dateFilter}
        {filters}
      </div>
    );
  }
}
FilterBox.propTypes = propTypes;
FilterBox.defaultProps = defaultProps;

function filterBox(slice) {
  const d3token = d3.select(slice.selector);

  const refresh = function () {
    d3token.selectAll('*').remove();

    // filter box should ignore the dashboard's filters
    const url = slice.jsonEndpoint({ extraFilters: false });
    $.getJSON(url, (payload) => {
      const fd = payload.form_data;
      // const filtersChoices = {};
      let filtersChoices = {};
      // Making sure the ordering of the fields matches the setting in the
      // dropdown as it may have been shuffled while serialized to json
      // payload.form_data.groupby.forEach((f) => {
      //   filtersChoices[f] = payload.data[f];
      // });
      filtersChoices = payload.data;
      console.log('filtersChoices: ' + JSON.stringify(filtersChoices));
      console.log('fd.widget ' + fd.widget + typeof fd.widget);
      ReactDOM.render(
        <FilterBox
          filtersChoices={filtersChoices}
          onChange={slice.setFilter}
          showDateFilter={fd.date_filter}
          origSelectedValues={slice.getFilters() || {}}
          widget={fd.widget}
        />,
        document.getElementById(slice.containerId)
      );
      slice.done(payload);
    })
    .fail(function (xhr) {
      slice.error(xhr.responseText, xhr);
    });
  };
  return {
    render: refresh,
    resize: () => {},
  };
}

module.exports = filterBox;
