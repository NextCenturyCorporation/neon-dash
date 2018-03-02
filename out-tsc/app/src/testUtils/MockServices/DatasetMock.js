var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
import { DatabaseMetaData, FieldMetaData, TableMetaData } from '../../app/dataset';
import { DatasetService } from '../../app/services/dataset.service';
import { NeonGTDConfig } from '../../app/neon-gtd-config';
var DatasetMock = /** @class */ (function (_super) {
    __extends(DatasetMock, _super);
    function DatasetMock() {
        var _this = _super.call(this, new NeonGTDConfig()) || this;
        var testDatabase = new DatabaseMetaData('testDatabase', 'Test Database');
        testDatabase.tables = [new TableMetaData('testTable', 'Test Table', DatasetMock.FIELDS)];
        _this.setActiveDataset({
            databases: [testDatabase]
        });
        return _this;
    }
    // Keep in alphabetical order.
    DatasetMock.FIELDS = [
        new FieldMetaData('testColorField', 'Test Color Field'),
        new FieldMetaData('testDateField', 'Test Date Field'),
        new FieldMetaData('testIdField', 'Test ID Field'),
        new FieldMetaData('testLatitudeField', 'Test Latitude Field'),
        new FieldMetaData('testLinkField', 'Test Link Field'),
        new FieldMetaData('testLongitudeField', 'Test Longitude Field'),
        new FieldMetaData('testSizeField', 'Test Size Field')
    ];
    return DatasetMock;
}(DatasetService));
export { DatasetMock };
//# sourceMappingURL=DatasetMock.js.map