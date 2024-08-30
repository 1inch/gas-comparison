const Table = require('cli-table3');
const chalk = require('chalk');

function createGasUsedTable(tableHeader, firstColumnHeader) {
    return new GasUsedTable({
        header: tableHeader,
        firstColumn: { content: firstColumnHeader },
        modifyElementHook: displayGasUsedElement,
        compareElementsHook: compareGasUsedElements,
    });
}

function displayGasUsedElement(element) {
    return Number(element).toLocaleString('en');
}

function compareGasUsedElements(displayedElement1, displayedElement2) {
    return parseInt(displayedElement2.replace(/,/g, '')) - parseInt(displayedElement1.replace(/,/g, ''));
}

class GasUsedTable {
    DEFAULT_FIRST_COLUMN = { columnAlign: 'left', headAlign: 'center', content: 'case' };
    DEFAULT_COLORS = { best: 'green', worst: 'red', neutral: 'white' };
    header = null;
    table = null;
    colors = null;

    constructor({ header, firstColumn, modifyElementHook, compareElementsHook, colors }) {
        this.createTable({ header, firstColumn });
        this.setColors(colors);
        if (modifyElementHook) {
            this.modifyElementHook = modifyElementHook;
        }
        if (compareElementsHook) {
            this.compareElementsHook = compareElementsHook;
        }
    }

    createTable({ header, firstColumn }) {
        firstColumn = firstColumn || this.DEFAULT_FIRST_COLUMN;
        this.table = new Table({
            head: header ? [{ colSpan: 1, content: chalk.blue(header) }] : [],
            colAligns: [firstColumn.columnAlign],
        });
        this.table.push([{ hAlign: firstColumn.headAlign, content: chalk.magenta(firstColumn.content) }]);
    }

    addRow(elements = []) {
        const newRowIndex = this.table.length;
        this.table[newRowIndex] = elements;
        return newRowIndex;
    }

    modifyElementHook(element) {
        return element;
    }

    addElementToRow(rowIndex, headKey, element, align = 'right') {
        headKey = chalk.magenta(headKey);
        let columnIndex = this.table[0].indexOf(headKey);
        if (columnIndex === -1) {
            this.table[0].push(headKey);
            columnIndex = this.table[0].length - 1;
            this.table.options.colAligns[columnIndex] = align;
            this.table.options.head[0].colSpan++;
        }
        this.table[rowIndex].push(this.modifyElementHook(element));
    }

    compareElementsHook(element1, element2) {
        return element1 - element2;
    }

    toString() {
        return this.toStringWithPercentages();
    }

    toStringDefault() {
        return this.table.toString();
    }

    toStringWithColors() {
        for (let i = 1; i < this.table.length; i++) {
            const row = this.table[i];
            const sortRow = row.slice(1).sort(this.compareElementsHook);
            const best = sortRow[sortRow.length - 1];
            const worst = sortRow[0];
            for (let j = 1; j < row.length; j++) {
                let cellColor;
                switch (row[j]) {
                    case best:
                        cellColor = this.colors.best;
                        break;
                    case worst:
                        cellColor = this.colors.worst;
                        break;
                    default:
                        cellColor = this.colors.neutral;
                }
                this.table[i][j] = chalk[cellColor](this.table[i][j]);
            }
        }
        return this.table.toString();
    }

    toStringWithPercentages() {
        // Patch table lline with dex names
        for (let i = 2; i < this.table[0].length; i++) {
            this.table[0][i] = { colSpan: 2, content: this.table[0][i] };
            this.table.options.colAligns[(i - 2) * 2 + 2] = 'center';
            this.table.options.colAligns[(i - 2) * 2 + 3] = 'center';
            this.table.options.head[0].colSpan++;
        }

        // Patch table lines with percentages and colors
        for (let i = 1; i < this.table.length; i++) {
            const row = this.table[i];
            const sortRow = row.slice(1).sort(this.compareElementsHook);
            const best = sortRow[sortRow.length - 1];
            const worst = sortRow[0];
            const comparePercentageValue = this.table[i][1];
            const tmpRow = [this.table[i][0]];
            for (let j = 1; j < row.length; j++) {
                let cellColor;
                switch (row[j]) {
                    case best:
                        cellColor = this.colors.best;
                        break;
                    case worst:
                        cellColor = this.colors.worst;
                        break;
                    default:
                        cellColor = this.colors.neutral;
                }
                if (j === 1) {
                    tmpRow[j] = chalk[cellColor](this.table[i][j]);
                } else {
                    let diff = (parseFloat(this.table[i][j].replace(/,/g, '')) / parseFloat(comparePercentageValue.replace(/,/g, ''))) * 100 - 100;
                    diff = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
                    tmpRow[(j - 2) * 2 + 2] = chalk[cellColor](this.table[i][j]);
                    tmpRow[(j - 2) * 2 + 3] = chalk[cellColor](`${diff}%`);
                }
            }
            this.table[i] = tmpRow;
        }
        return this.table.toString();
    }

    setColors(colors) {
        this.colors = colors || this.DEFAULT_COLORS;
    }
}

module.exports = {
    createGasUsedTable,
    compareGasUsedElements,
    displayGasUsedElement,
    GasUsedTable,
};
