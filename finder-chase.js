if(typeof(String.prototype.trim) === "undefined")
{
    String.prototype.trim = function()
    {
        return String(this).replace(/^\s+|\s+$/g, '');
    };
}

if(typeof(String.prototype.searchBetween) === "undefined")
{
    String.prototype.searchBetween = function(begin_pattern, end_pattern)
    {
        let s = String(this);
        let begin = s.search(begin_pattern) + begin_pattern.length;
        let end = s.substring(begin).search(end_pattern) + begin;
        return s.substring(begin, end);
    };
}

class ChaseRecord
{
    constructor()
    {
        this.account_title = "";
        this.date = new Date();
        this.payee = "";
        this.price = "";
        this.category = "";
        this.negative = false;
    }
}

class BeancountRecord
{
    constructor()
    {
        this.date = new Date();
        this.payee = "";
        this.description = "";
        this.paying_account = "";
        this.expense_account = "";
        this.price = "";
        this.negative = false;
        this.finalized = false;
    }
}

function cleanUpPrice(price_str)
{
    console.debug("Cleaning up " + price_str);
    if(price_str[0] == "-")
    {
        return "-" + cleanUpPrice(price_str.substring(1));
    }
    if(price_str[0] == "$")
    {
        price_str = price_str.substring(1);
    }
    return price_str.replaceAll(",", "");
}

function strNeg(price_str)
{
    if(price_str[0] == "-")
    {
        return price_str.substring(1);
    }
    else
    {
        return "-" + price_str;
    }
}

class ChaseRecordsReader
{
    constructor() {}

    #readCreditCardCategory(row)
    {
        let cat = row.querySelector(".category mds-link");
        if(cat == null)
        {
            return "";
        }
        else
        {
            return cat.attributes.text.value.trim();
        }
    }

    #readAccountType(row)
    {
        return row.querySelector(".type > .column-info").textContent.trim();
    }

    readOrders()
    {
        var records = [];

        var type = "CreditCard";
        if(document.querySelector("td.category") == null)
        {
            type = "Account";
        }
        let activity_table = document.getElementById("activityTableslideInActivity");
        let account_title = document.getElementById("slideInAccountHeader").textContent;
        for(const row of activity_table.querySelectorAll("tbody > tr"))
        {
            let rec = new ChaseRecord();
            let date_str = row.querySelector(".date > .column-info").textContent;
            rec.date = new Date(Date.parse(date_str));
            rec.payee = row.querySelector(".description > .column-info").textContent.trim();
            if(type == "CreditCard")
            {
                rec.category = this.#readCreditCardCategory(row);
                rec.negative = true;
            }
            else
            {
                rec.category = this.#readAccountType(row);
            }
            rec.price = cleanUpPrice(
                row.querySelector(".amount > .column-info").textContent);
            rec.account_title = account_title.trim();
            records.push(rec);
        }

        return records.reverse();
    }
}

class RecordProcessor
{
    constructor(config_chase)
    {
        // Make a deep copy.
        this.config = JSON.parse(JSON.stringify(config_chase));
        for(var account of this.config.accounts)
        {
            account.pattern_card_title = new RegExp(account.pattern_card_title, "i");
        }
        for(var matcher of this.config.payee_matchers)
        {
            matcher.pattern_payee = new RegExp(matcher.pattern_payee, "i");
            matcher.pattern_category = new RegExp(matcher.pattern_category, "i")
        }
    }

    processRecord(record)       // ChaseRecord –> BeancountRecord
    {
        let result = new BeancountRecord();
        for(const account_config of this.config.accounts)
        {
            if(account_config.pattern_card_title.test(record.account_title))
            {
                result.paying_account = account_config.account_paying;
                break;
            }
        }
        if(result.paying_account == "")
        {
            return null;
        }

        result.date = record.date;
        result.price = record.price;
        result.payee = record.payee;
        result.negative = record.negative;
        for(const matcher of this.config.payee_matchers)
        {
            if(matcher.pattern_payee.test(record.payee) &&
               matcher.pattern_category.test(record.category))
            {
                result.payee = matcher.payee;
                result.description = matcher.description;
                result.expense_account = matcher.account_expanse;
                result.finalized = true;
                break;
            }
        }

        if(result.payee == "")
        {
            // Payee is empty in the matcher. This is usually a
            // wildcard rule. Restore the payee from the bank, and
            // mark it incorrect.
            result.payee = record.payee;
            result.finalized = false;
        }
        return result;
    }
}

class RecordsWriter
{
    constructor() {}

    writeAsString(order)        // “order” is a BeancountRecord.
    {
        let lines = new Array();
        let date = `${order.date.getFullYear()}-\
${(order.date.getMonth()+1).toString().padStart(2, '0')}-\
${order.date.getDate().toString().padStart(2, '0')}`;
        let status_symbol = "*";
        if(!order.finalized)
        {
            status_symbol = "!";
        }
        lines.push(`${date} ${status_symbol} "${order.payee}" "${order.description}"`);
        if(order.expense_account != "")
        {
            let price = order.price;
            if(!order.negative)
            {
                price = strNeg(price);
            }
            lines.push(`  ${order.expense_account} ${price} USD`);
        }
        let price = order.price;
        if(order.negative)
        {
            price = strNeg(price);
        }
        lines.push(`  ${order.paying_account} ${price} USD`);
        return lines.join('\n');
    }
}

function run(config)
{
    let reader = new ChaseRecordsReader();
    let processor = new RecordProcessor(config.config_chase);
    let writer = new RecordsWriter();
    let orders = reader.readOrders();

    let processed = [];
    for(const order of orders)
    {
        let record = processor.processRecord(order);
        if(record != null)
        {
            processed.push(record);
        }
    }
    const result = processed.map((order) => writer.writeAsString(order))
          .join("\n\n");

    let bean_node = document.getElementById("amazon-bean");
    if(bean_node === null)
    {
        bean_node = document.createElement("textarea")
        bean_node.style["font-family"] = "monospace";
        bean_node.style["border"] = "5px solid green";
        bean_node.style["background-color"] = "white";
        bean_node.style["padding"] = 20;
        bean_node.style["width"] = "100%";
        bean_node.setAttribute("readonly", true);
        bean_node.setAttribute("rows", 40);
        bean_node.id = "bean";
        bean_node.value = result;
        document.getElementById("flyoutContentWrapper")
            .insertAdjacentElement("afterbegin", bean_node);
    }
}

function prepareDocument()
{
    console.debug("Trying to add button...");
    if(document.getElementById("bean-it") != null)
    {
        return;
    }
    let toolbar = document.querySelector(
        "#activityContainerslideInActivity > .overview-activity-container .activity-header" );
    if(toolbar === null)
    {
        return;
    }
    console.debug("Found the tool bar.");
    let button = document.createElement("button")
    button.innerText = "Bean!";
    button.id = "bean-it";
    button.type = "button";
    button.onclick = () => Configuration.load().then((c) => run(c));

    toolbar.appendChild(button);
}

console.debug("Starting timer...");
setInterval(prepareDocument, 5000);
