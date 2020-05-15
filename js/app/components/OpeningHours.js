import React from 'react'
import moment from 'moment'
import _ from 'lodash'
import i18n from '../i18n'
import { Button, ConfigProvider, TimePicker } from 'antd'
import classNames from 'classnames'

import openingHourIntervalToReadable from '../restaurant/parseOpeningHours'
import TimeRange from '../utils/TimeRange'
import { antdLocale } from '../i18n'

const timeFormat = 'HH:mm'

let minutes = []
for (let i = 0; i <= 60; i++) {
  if (0 !== i % 15) {
    minutes.push(i)
  }
}

export default class extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      weekdays: TimeRange.weekdaysShort(props.locale),
      rowsWithErrors: props.rowsWithErrors,
      rows: [],
      behavior: props.behavior || 'asap',
      rev: 0,
    }
  }

  componentDidMount() {
    let rows = [ this.createRowData() ]
    if (this.props.value) {
      rows = _.map(this.props.value, (value) => this.parseOpeningHours(value))
    }
    this.setState({ rows })
    this.props.onLoad(this.rowsToString(rows))
  }

  parseOpeningHours(text) {

    const { days, start, end } = TimeRange.parse(text)
    const { weekdays } = this.state

    return {
      start: start,
      end: end,
      weekdays: _.map(weekdays, (weekday) => {
        return _.extend({ checked: _.includes(days, weekday.key) }, weekday)
      })
    }
  }

  setBehavior(behavior) {
    this.setState({ behavior })
  }

  onStartChange(key, date, timeString) {

    if (!timeString) {
      timeString = '00:00'
    }

    const { rows } = this.state
    const row = rows[key]

    row.start = timeString

    rows.splice(key, 1, row)
    this.setState({ rows })

    this.props.onChange(_.map(rows, (row) => this.rowToString(row)))
  }

  onEndChange(key, date, timeString) {

    if (!timeString) {
      timeString = '00:00'
    }

    const { rows } = this.state
    const row = rows[key]

    row.end = timeString

    rows.splice(key, 1, row)
    this.setState({ rows })

    this.props.onChange(_.map(rows, (row) => this.rowToString(row)))
  }

  onCheckboxChange(key, weekdayKey, e) {

    const { rows } = this.state
    const row = rows[key]

    const weekday = _.findIndex(row.weekdays, (wd) => wd.key === weekdayKey)
    row.weekdays[weekday].checked = e.target.checked

    rows.splice(key, 1, row)
    this.setState({ rows })

    this.props.onChange(_.map(rows, (row) => this.rowToString(row)))
  }

  isWeekdayChecked(row, weekdayKey) {
    const weekday = _.findIndex(row.weekdays, (wd) => wd.key === weekdayKey)

    return row.weekdays[weekday].checked
  }

  rowToString(row) {
    let isPrevChecked = false
    let ranges = []
    let buffer = []
    _.each(row.weekdays, (weekday) => {
      if (weekday.checked) {
        if (buffer.length === 0) {
          ranges.push(buffer)
        }
        buffer.push(weekday.key)
      } else {
        if (isPrevChecked) {
          buffer = []
        }
      }
      isPrevChecked = weekday.checked
    })

    const days = _.map(ranges, (range) => {
      if (range.length > 1) {
        return range[0] + '-' + range[range.length - 1]
      } else {
        return range[0]
      }
    }).join(',')

    const hours = [row.start, row.end].join('-')

    return days + ' ' + hours
  }

  rowsToString(rows) {
    return _.map(rows, (row) => {
      return this.rowToString(row)
    })
  }

  toArray() {
    return this.rowsToString(this.state.rows)
  }

  disabledMinutes() {
    return minutes
  }

  renderRow(row, index) {

    const { weekdays, rev } = this.state
    const startValue = row.start ? moment(row.start + ':00', 'HH:mm:ss') : null
    const endValue = row.end ? moment(row.end + ':00', 'HH:mm:ss') : null

    return (
      <tr key={ `${index}-${rev}` }
        className={ classNames({ 'danger': (-1 !== this.props.rowsWithErrors.indexOf(index)) }) }>
        <td width="50%">
          <span className="mr-3">
            <TimePicker
              disabledMinutes={this.disabledMinutes}
              onChange={this.onStartChange.bind(this, index)}
              defaultValue={startValue}
              format={timeFormat}
              hideDisabledOptions
              placeholder="Heure"
              addon={panel => (
                <Button size="small" type="primary" onClick={() => panel.close()}>OK</Button>
              )}
            />
            <TimePicker
              disabledMinutes={this.disabledMinutes}
              onChange={this.onEndChange.bind(this, index)}
              defaultValue={endValue}
              format={timeFormat}
              hideDisabledOptions
              placeholder="Heure"
              addon={panel => (
                <Button size="small" type="primary" onClick={() => panel.close()}>OK</Button>
              )}
            />
          </span>
          <small className="text-muted">{ openingHourIntervalToReadable(this.rowToString(row), this.props.locale, this.state.behavior) }</small>
        </td>
        {_.map(weekdays, (weekday) => (
          <td key={weekday.key} className={ _.includes(['Sa', 'Su'], weekday.key) ? 'active text-center' : 'text-center'}>
            <input type="checkbox"
              onChange={this.onCheckboxChange.bind(this, index, weekday.key)}
              checked={this.isWeekdayChecked(row, weekday.key)}
              className="form-input" />
          </td>
        ))}
        <td>
          <button onClick={this.removeRow.bind(this, index)} type="button" className="close" data-dismiss="alert" aria-label="Close">
            <span aria-hidden="true">&times;</span>
          </button>
        </td>
      </tr>
    )
  }

  createRowData() {
    const { weekdays } = this.state
    return {
      start: '00:00',
      end: '23:59',
      weekdays: _.map(weekdays, (weekday) => {
        return _.extend({ checked: false }, weekday)
      })
    }
  }

  addRow(e) {
    e.preventDefault()
    const { rows } = this.state
    rows.push(this.createRowData())
    this.setState({ rows, rev: this.state.rev + 1 })
    this.props.onRowAdd()
  }

  removeRow(index, e) {
    e.preventDefault()
    const rows = this.state.rows.slice()
    rows.splice(index, 1)
    this.setState({ rows, rev: this.state.rev + 1 })
    this.props.onRowRemove(index)
  }

  render() {
    const { weekdays } = this.state
    return (
      <ConfigProvider locale={ antdLocale }>
        <div>
          <table className="table">
            <thead>
              <tr>
                <th>{i18n.t('DELIVERY_TIME_SLOTS')}</th>
                {_.map(weekdays, (weekday) => (
                  <th key={weekday.key} className={ _.includes(['Sa', 'Su'], weekday.key) ? 'active text-center' : 'text-center'}>{weekday.name}</th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {_.map(this.state.rows, (row, index) => this.renderRow(row, index))}
            </tbody>
          </table>
          <button className="btn btn-sm btn-success" onClick={this.addRow.bind(this)}>{i18n.t('ADD_BUTON')}</button>
        </div>
      </ConfigProvider>
    )
  }
}
