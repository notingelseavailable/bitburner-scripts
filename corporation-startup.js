const CITIES = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];

function setns(_ns) {
    ns = _ns;
}
function cleanLogs() {
    ns.disableLog("disableLog")
    ns.disableLog("sleep")
    ns.disableLog("exec")
    ns.disableLog("getServerMaxRam")
    ns.disableLog("getServerSecurityLevel")
    ns.disableLog("getServerMinSecurityLevel")
    ns.disableLog("getServerMaxMoney")
    ns.disableLog("getHackingLevel")
    ns.disableLog("getServerRequiredHackingLevel")
    ns.disableLog("scan")
    ns.disableLog("getServerMoneyAvailable")
    ns.disableLog("getServerUsedRam")
}
function stFormat(ns, ms, showms = true, showfull = false) {
    let timeLeft = ms;
    let hours = Math.floor(ms / (1000 * 60 * 60));
    timeLeft -= hours * (1000 * 60 * 60);
    let minutes = Math.floor(timeLeft / (1000 * 60));
    timeLeft -= minutes * (1000 * 60);
    let seconds = Math.floor(timeLeft / 1000);
    timeLeft -= seconds * 1000;
    let milliseconds = timeLeft;

    if (showms) {
        if (hours > 0 || showfull) return ns.sprintf("%02d:%02d:%02d.%03d", hours, minutes, seconds, milliseconds);
        if (minutes > 0) return ns.sprintf("%02d:%02d.%03d", minutes, seconds, milliseconds);
        return ns.sprintf("%02d.%03d", seconds, milliseconds);
    } else {
        if (hours > 0 || showfull) return ns.sprintf("%02d:%02d:%02d", hours, minutes, seconds);
        if (minutes > 0) return ns.sprintf("%02d:%02d", minutes, seconds);
        return ns.sprintf("%02d", seconds);
    }
}

function doLog(ns, str, ...args) {
    ns.print(ns.sprintf("%8s " + str, new Date().toLocaleTimeString("it-IT"), ...args));
}

/** @param {import(".").NS } ns */
export async function main(ns) {
    setns(ns);
    cleanLogs();

    const agDivName = "Agriculture";
    const tbDivName = "Tobacco";
    const tbRDCity = "Aevum";

    try {
        ns.corporation.getCorporation();
    } catch (e) {
        doLog(ns, "Created Corporation for $150b");
        ns.corporation.createCorporation("Corporation", true);
    }

    // open the Agriculture division
    if (ns.corporation.getCorporation().divisions.find((div) => div.type === agDivName) === undefined) {
        let divCost = ns.corporation.getExpandIndustryCost(agDivName);

        doLog(ns, "Starting %s division for %s", agDivName, ns.nFormat(divCost, "($0.000a)"));

        ns.corporation.expandIndustry(agDivName, agDivName);
    }

    // buy one time upgrades Smart Supply and Warehouse API
    for (const upgrade of ["Smart Supply", "Warehouse API"]) {
        if (!ns.corporation.hasUnlockUpgrade(upgrade)) {
            let upgradeCost = ns.corporation.getUnlockUpgradeCost(upgrade);
            let corpFunds = ns.corporation.getCorporation().funds;

            if (corpFunds < upgradeCost) {
                doLog(
                    ns,
                    "WARNING: Insufficient funds to purchase %s %s < %s",
                    upgrade,
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
            } else {
                doLog(ns, "Purchasing %s upgrade for %s", upgrade, ns.nFormat(upgradeCost, "($0.000a)"));
                ns.corporation.unlockUpgrade(upgrade);
            }
        }
    }

    // buy levelable upgrades FocusWires, Neural Accelerators, Speech Processor Implants,
    // Nuoptimal Nootropic Injector Implants, and Smart Factories
    let leveledUpgrades = [
        "FocusWires",
        "Neural Accelerators",
        "Speech Processor Implants",
        "Nuoptimal Nootropic Injector Implants",
        "Smart Factories",
    ];
    for (const upgrade of leveledUpgrades) {
        while (ns.corporation.getUpgradeLevel(upgrade) < 2) {
            let upgradeCost = ns.corporation.getUpgradeLevelCost(upgrade);
            let corpFunds = ns.corporation.getCorporation().funds;

            if (corpFunds < upgradeCost) {
                doLog(
                    ns,
                    "WARNING: Insufficient funds to purchase %s %s < %s",
                    upgrade,
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
                break;
            } else {
                doLog(ns, "Purchasing %s upgrade for %s", upgrade, ns.nFormat(upgradeCost, "($0.000a)"));
                ns.corporation.levelUpgrade(upgrade);
            }
        }
    }

    // Check primary city's warehouse and upgrade to 500
    const primaryCity = ns.corporation.getDivision(agDivName).cities[0];
    if (!ns.corporation.hasWarehouse(agDivName, primaryCity)) {
        doLog(ns, "ERROR: %s primary city %s does not have a warehouse", agDivName, primaryCity);
        return;
    }

    while (ns.corporation.getWarehouse(agDivName, primaryCity).size < 500) {
        let upgradeCost = ns.corporation.getUpgradeWarehouseCost(agDivName, primaryCity);
        let corpFunds = ns.corporation.getCorporation().funds;
        let startSize = ns.corporation.getWarehouse(agDivName, primaryCity).size;

        if (corpFunds < upgradeCost) {
            doLog(
                ns,
                "WARNING: Insufficient funds to purchase a warehouse upgrade %s < %s",
                ns.nFormat(corpFunds, "($0.000a)"),
                ns.nFormat(upgradeCost, "($0.000a)")
            );
        } else {
            ns.corporation.upgradeWarehouse(agDivName, primaryCity);
            let endSize = ns.corporation.getWarehouse(agDivName, primaryCity).size;
            doLog(
                ns,
                "Upgraded %s %s's warehouse size from %s to %s for %s",
                agDivName,
                primaryCity,
                ns.nFormat(startSize, "(0.000a)"),
                ns.nFormat(endSize, "(0.000a)"),
                ns.nFormat(upgradeCost, "($0.000a)")
            );
        }
    }

    if (ns.corporation.getWarehouse(agDivName, primaryCity).size < 500) {
        doLog(
            ns,
            "ERROR: %s primary city %s's warehouse is too small %d < 500",
            agDivName,
            primaryCity,
            ns.corporation.getWarehouse(agDivName, primaryCity).size
        );

        return;
    }

    // buy production materials for primary city
    if (ns.corporation.getMaterial(agDivName, primaryCity, "Real Estate").qty === 0) {
        ns.corporation.buyMaterial(agDivName, primaryCity, "Hardware", 12.5);
        ns.corporation.buyMaterial(agDivName, primaryCity, "AI Cores", 7.5);
        ns.corporation.buyMaterial(agDivName, primaryCity, "Real Estate", 2700);

        while (ns.corporation.getMaterial(agDivName, primaryCity, "Real Estate").qty === 0) await ns.sleep(5);

        doLog(ns, "Purchased Round 1 of %s production materials in %s", agDivName, primaryCity);

        ns.corporation.buyMaterial(agDivName, primaryCity, "Hardware", 0);
        ns.corporation.buyMaterial(agDivName, primaryCity, "AI Cores", 0);
        ns.corporation.buyMaterial(agDivName, primaryCity, "Real Estate", 0);
    }

    ns.corporation.setSmartSupply(agDivName, primaryCity, true);

    // Attempt to get first round of funding
    while (ns.corporation.getInvestmentOffer().round < 2) {
        doLog(ns, "Investment round 1: waiting for %s %s warehouse to fill", agDivName, primaryCity);

        // Sell plants but not food (food is more expensive per unit)
        ns.corporation.sellMaterial(agDivName, primaryCity, "Food", "0", "MP");
        ns.corporation.sellMaterial(agDivName, primaryCity, "Plants", "0", "MP");

        while (
            ns.corporation.getWarehouse(agDivName, primaryCity).sizeUsed <
            ns.corporation.getWarehouse(agDivName, primaryCity).size * 0.95
        ) {
            await ns.sleep(1000);
        }

        doLog(
            ns,
            "Investment round 1: %s %s warehouse is full, initiating bulk sell-off to woo investors",
            agDivName,
            primaryCity
        );

        ns.corporation.sellMaterial(agDivName, primaryCity, "Food", "MAX", "MP*1");
        ns.corporation.sellMaterial(agDivName, primaryCity, "Plants", "MAX", "MP*1");

        let tookOffer = false;
        let bestOffer = ns.corporation.getInvestmentOffer();
        while (ns.corporation.getWarehouse(agDivName, primaryCity).sizeUsed > 151) {
            let offer = ns.corporation.getInvestmentOffer();

            // only take offers over $335b
            if (offer.funds > 335000000000) {
                ns.corporation.acceptInvestmentOffer();
                doLog(
                    ns,
                    "Investment round 1: Taking offer of %s for %d%%",
                    ns.nFormat(offer.funds, "(0.000a)"),
                    (offer.shares / 1000000000) * 100
                );
                tookOffer = true;
                break;
            }

            if (offer.funds > bestOffer.funds) {
                bestOffer = offer;
            }

            await ns.sleep(100);
        }

        if (!tookOffer) {
            doLog(
                ns,
                "Investment round 1: Failed to generate an offer over $335b (best: %s for %d%%)",
                ns.nFormat(bestOffer.funds, "(0.000a)"),
                (bestOffer.shares / 1000000000) * 100
            );
        }
    }

    // revert sale prices for now
    ns.corporation.sellMaterial(agDivName, primaryCity, "Food", "MAX", "MP");
    ns.corporation.sellMaterial(agDivName, primaryCity, "Plants", "MAX", "MP");

    // buy one time upgrade Office API
    for (const upgrade of ["Office API"]) {
        if (!ns.corporation.hasUnlockUpgrade(upgrade)) {
            let upgradeCost = ns.corporation.getUnlockUpgradeCost(upgrade);
            let corpFunds = ns.corporation.getCorporation().funds;

            if (corpFunds < upgradeCost) {
                doLog(
                    ns,
                    "ERROR: Insufficient funds to purchase %s %s < %s",
                    upgrade,
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
                return;
            } else {
                doLog(ns, "Purchasing %s upgrade for %s", upgrade, ns.nFormat(upgradeCost, "($0.000a)"));
                ns.corporation.unlockUpgrade(upgrade);
            }
        }
    }

    // Expand to additional cities
    for (const city of CITIES.filter((a) => !ns.corporation.getDivision(agDivName).cities.includes(a))) {
        let expandCost = ns.corporation.getExpandCityCost();
        let corpFunds = ns.corporation.getCorporation().funds;

        if (corpFunds < expandCost) {
            doLog(
                ns,
                "ERROR: Insufficient funds to expand %s to %s %s < %s",
                agDivName,
                city,
                ns.nFormat(corpFunds, "($0.000a)"),
                ns.nFormat(expandCost, "($0.000a)")
            );

            return;
        } else {
            doLog(ns, "Expanding %s to %s for %s", agDivName, city, ns.nFormat(expandCost, "($0.000a)"));
            ns.corporation.expandCity(agDivName, city);
        }
    }

    // Buy warehouses in all cities
    for (const city of ns.corporation.getDivision(agDivName).cities) {
        if (!ns.corporation.hasWarehouse(agDivName, city)) {
            let warehouseCost = ns.corporation.getPurchaseWarehouseCost();
            let corpFunds = ns.corporation.getCorporation().funds;

            if (warehouseCost <= corpFunds) {
                doLog(
                    ns,
                    "Purchasing a %s warehouse in %s for %s",
                    agDivName,
                    city,
                    ns.nFormat(warehouseCost, "($0.000a)")
                );
                ns.corporation.purchaseWarehouse(agDivName, city);
            } else {
                doLog(
                    ns,
                    "Insufficient funds to purchase a %s warehouse in %s %s < %s",
                    agDivName,
                    city,
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(warehouseCost, "($0.000a)")
                );
                return;
            }
        }

        // upgrade the size of the warehouses in all of the cities to 500
        while (ns.corporation.getWarehouse(agDivName, city).size < 500) {
            let upgradeCost = ns.corporation.getUpgradeWarehouseCost(agDivName, city);
            let corpFunds = ns.corporation.getCorporation().funds;
            let startSize = ns.corporation.getWarehouse(agDivName, city).size;

            if (corpFunds < upgradeCost) {
                doLog(
                    ns,
                    "WARNING: Insufficient funds to purchase a warehouse upgrade %s < %s",
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
            } else {
                ns.corporation.upgradeWarehouse(agDivName, city);
                let endSize = ns.corporation.getWarehouse(agDivName, city).size;
                doLog(
                    ns,
                    "Upgraded %s %s's warehouse size from %s to %s for %s",
                    agDivName,
                    city,
                    ns.nFormat(startSize, "(0.000a)"),
                    ns.nFormat(endSize, "(0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
            }
        }

        ns.corporation.setSmartSupply(agDivName, city, true);
        ns.corporation.sellMaterial(agDivName, city, "Food", "MAX", "MP");
        ns.corporation.sellMaterial(agDivName, city, "Plants", "MAX", "MP");
    }

    // upgrade the office size in every city to 9 and assign jobs
    for (const city of ns.corporation.getDivision(agDivName).cities) {
        if (ns.corporation.getOffice(agDivName, city).size >= 9) {
            continue;
        }

        let upgradeCost = ns.corporation.getOfficeSizeUpgradeCost(
            agDivName,
            city,
            9 - ns.corporation.getOffice(agDivName, city).size
        );
        let corpFunds = ns.corporation.getCorporation().funds;

        if (corpFunds < upgradeCost) {
            doLog(
                ns,
                "ERROR: Insufficient funds to increase %s %s office size to 9 %s < %s",
                agDivName,
                city,
                ns.nFormat(corpFunds, "($0.000a)"),
                ns.nFormat(upgradeCost, "($0.000a)")
            );
            return;
        } else {
            doLog(
                ns,
                "Purchasing %d additional office positions in %s %s for %s",
                9 - ns.corporation.getOffice(agDivName, city).size,
                agDivName,
                city,
                ns.nFormat(upgradeCost, "($0.000a)")
            );
            ns.corporation.upgradeOfficeSize(agDivName, city, 9 - ns.corporation.getOffice(agDivName, city).size);
        }

        while (ns.corporation.getOffice(agDivName, city).employees.length < 9) {
            ns.corporation.hireEmployee(agDivName, city);
        }

        for (const employee of ns.corporation.getOffice(agDivName, city).employees)
            ns.corporation.assignJob(agDivName, city, employee, "Unassigned");

        await ns.corporation.setAutoJobAssignment(agDivName, city, "Operations", 2);
        await ns.corporation.setAutoJobAssignment(agDivName, city, "Engineer", 2);
        await ns.corporation.setAutoJobAssignment(agDivName, city, "Business", 1);
        await ns.corporation.setAutoJobAssignment(agDivName, city, "Management", 2);
        await ns.corporation.setAutoJobAssignment(agDivName, city, "Research & Development", 2);
    }

    // buy production materials for all cities
    for (const city of ns.corporation.getDivision(agDivName).cities) {
        if (ns.corporation.getMaterial(agDivName, city, "Real Estate").qty === 0) {
            ns.corporation.buyMaterial(agDivName, city, "Hardware", 12.5);
            ns.corporation.buyMaterial(agDivName, city, "AI Cores", 7.5);
            ns.corporation.buyMaterial(agDivName, city, "Real Estate", 2700);

            while (ns.corporation.getMaterial(agDivName, city, "Real Estate").qty === 0) await ns.sleep(5);

            doLog(ns, "Purchased Round 1 of %s production materials in %s", agDivName, city);

            ns.corporation.buyMaterial(agDivName, city, "Hardware", 0);
            ns.corporation.buyMaterial(agDivName, city, "AI Cores", 0);
            ns.corporation.buyMaterial(agDivName, city, "Real Estate", 0);
        }
    }

    // Upgrade Smart Factories and Smart Storage
    leveledUpgrades = ["Smart Factories", "Smart Storage"];
    for (const upgrade of leveledUpgrades) {
        while (ns.corporation.getUpgradeLevel(upgrade) < 10) {
            let upgradeCost = ns.corporation.getUpgradeLevelCost(upgrade);
            let corpFunds = ns.corporation.getCorporation().funds;

            if (corpFunds < upgradeCost) {
                doLog(
                    ns,
                    "WARNING: Insufficient funds to purchase %s %s < %s",
                    upgrade,
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
                break;
            } else {
                doLog(ns, "Purchasing %s upgrade for %s", upgrade, ns.nFormat(upgradeCost, "($0.000a)"));
                ns.corporation.levelUpgrade(upgrade);
            }
        }
    }

    // Increase Warehouse Sizes to 2k
    for (const city of ns.corporation.getDivision(agDivName).cities) {
        while (ns.corporation.getWarehouse(agDivName, city).size < 2000) {
            let upgradeCost = ns.corporation.getUpgradeWarehouseCost(agDivName, city);
            let corpFunds = ns.corporation.getCorporation().funds;
            let startSize = ns.corporation.getWarehouse(agDivName, city).size;

            if (corpFunds < upgradeCost) {
                doLog(
                    ns,
                    "WARNING: Insufficient funds to purchase a warehouse upgrade %s < %s",
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
            } else {
                ns.corporation.upgradeWarehouse(agDivName, city);
                let endSize = ns.corporation.getWarehouse(agDivName, city).size;
                doLog(
                    ns,
                    "Upgraded %s %s's warehouse size from %s to %s for %s",
                    agDivName,
                    city,
                    ns.nFormat(startSize, "(0.000a)"),
                    ns.nFormat(endSize, "(0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
            }
        }
    }

    // buy second round production materials for all cities
    for (const city of ns.corporation.getDivision(agDivName).cities) {
        if (ns.corporation.getMaterial(agDivName, city, "Real Estate").qty < 140000) {
            ns.corporation.buyMaterial(agDivName, city, "Hardware", 267.5);
            ns.corporation.buyMaterial(agDivName, city, "Robots", 9.6);
            ns.corporation.buyMaterial(agDivName, city, "AI Cores", 244.5);
            ns.corporation.buyMaterial(agDivName, city, "Real Estate", 11940);

            while (ns.corporation.getMaterial(agDivName, city, "Real Estate").qty < 140000) await ns.sleep(5);

            doLog(ns, "Purchased Round 2 of %s production materials in %s", agDivName, city);

            ns.corporation.buyMaterial(agDivName, city, "Hardware", 0);
            ns.corporation.buyMaterial(agDivName, city, "Robots", 0);
            ns.corporation.buyMaterial(agDivName, city, "AI Cores", 0);
            ns.corporation.buyMaterial(agDivName, city, "Real Estate", 0);
        }
    }

    // Attempt to get second round of funding
    while (ns.corporation.getInvestmentOffer().round < 3) {
        doLog(ns, "Investment round 2: waiting for %s warehouses to fill", agDivName);

        // Sell plants but not food (food is more expensive per unit)
        for (const city of ns.corporation.getDivision(agDivName).cities) {
            ns.corporation.sellMaterial(agDivName, city, "Food", "0", "0");
            ns.corporation.sellMaterial(agDivName, city, "Plants", "MAX", "MP");
        }

        while (true) {
            let doBreak = true;
            for (const city of ns.corporation.getDivision(agDivName).cities) {
                if (
                    ns.corporation.getWarehouse(agDivName, city).sizeUsed <
                    ns.corporation.getWarehouse(agDivName, city).size * 0.95
                ) {
                    doBreak = false;
                    break;
                }
            }

            if (doBreak) break;
            await ns.sleep(1000);
        }

        doLog(
            ns,
            "Investment round 2: %s warehouses are full, initiating bulk sell-off to woo investors",
            agDivName
        );

        for (const city of ns.corporation.getDivision(agDivName).cities) {
            ns.corporation.sellMaterial(agDivName, city, "Food", "MAX", "MP*0.9");
            ns.corporation.sellMaterial(agDivName, city, "Plants", "MAX", "MP*0.9");
        }

        let tookOffer = false;
        let bestOffer = ns.corporation.getInvestmentOffer();
        while (ns.corporation.getWarehouse(agDivName, primaryCity).sizeUsed > 1250) {
            let offer = ns.corporation.getInvestmentOffer();

            //only take offers over $10t
            if (offer.funds > 10000000000000) {
                ns.corporation.acceptInvestmentOffer();
                doLog(
                    ns,
                    "Investment round 2: Taking offer of %s for %d%%",
                    ns.nFormat(offer.funds, "(0.000a)"),
                    (offer.shares / 1000000000) * 100
                );
                tookOffer = true;
                break;
            }

            if (offer.funds > bestOffer.funds) {
                bestOffer = offer;
            }

            await ns.sleep(100);
        }

        if (!tookOffer) {
            doLog(
                ns,
                "Investment round 2: Failed to generate an offer over $10t (best: %s for %d%%)",
                ns.nFormat(bestOffer.funds, "(0.000a)"),
                (bestOffer.shares / 1000000000) * 100
            );
        }
    }

    // Increase Warehouse Sizes to 3.8k
    for (const city of ns.corporation.getDivision(agDivName).cities) {
        while (ns.corporation.getWarehouse(agDivName, city).size < 3800) {
            let upgradeCost = ns.corporation.getUpgradeWarehouseCost(agDivName, city);
            let corpFunds = ns.corporation.getCorporation().funds;
            let startSize = ns.corporation.getWarehouse(agDivName, city).size;

            if (corpFunds < upgradeCost) {
                doLog(
                    ns,
                    "WARNING: Insufficient funds to purchase a warehouse upgrade %s < %s",
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
            } else {
                ns.corporation.upgradeWarehouse(agDivName, city);
                let endSize = ns.corporation.getWarehouse(agDivName, city).size;
                doLog(
                    ns,
                    "Upgraded %s %s's warehouse size from %s to %s for %s",
                    agDivName,
                    city,
                    ns.nFormat(startSize, "(0.000a)"),
                    ns.nFormat(endSize, "(0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
            }
        }
    }

    // buy third round production materials for all cities
    for (const city of ns.corporation.getDivision(agDivName).cities) {
        if (ns.corporation.getMaterial(agDivName, city, "Real Estate").qty < 230000) {
            ns.corporation.buyMaterial(agDivName, city, "Hardware", 650);
            ns.corporation.buyMaterial(agDivName, city, "Robots", 63);
            ns.corporation.buyMaterial(agDivName, city, "AI Cores", 375);
            ns.corporation.buyMaterial(agDivName, city, "Real Estate", 8400);

            while (ns.corporation.getMaterial(agDivName, city, "Real Estate").qty < 230000) await ns.sleep(5);

            doLog(ns, "Purchased Round 3 of %s production materials in %s", agDivName, city);

            ns.corporation.buyMaterial(agDivName, city, "Hardware", 0);
            ns.corporation.buyMaterial(agDivName, city, "Robots", 0);
            ns.corporation.buyMaterial(agDivName, city, "AI Cores", 0);
            ns.corporation.buyMaterial(agDivName, city, "Real Estate", 0);
        }
    }

    // open the Tobacco division
    if (ns.corporation.getCorporation().divisions.find((div) => div.type === tbDivName) === undefined) {
        let divCost = ns.corporation.getExpandIndustryCost(tbDivName);
        doLog(ns, "Starting %s division for %s", tbDivName, ns.nFormat(divCost, "($0.000a)"));

        ns.corporation.expandIndustry(tbDivName, tbDivName);
    }

    // Expand to additional cities
    for (const city of CITIES.filter((a) => !ns.corporation.getDivision(tbDivName).cities.includes(a))) {
        let expandCost = ns.corporation.getExpandCityCost();
        let corpFunds = ns.corporation.getCorporation().funds;

        if (corpFunds < expandCost) {
            doLog(
                ns,
                "ERROR: Insufficient funds to expand %s to %s %s < %s",
                tbDivName,
                city,
                ns.nFormat(corpFunds, "($0.000a)"),
                ns.nFormat(expandCost, "($0.000a)")
            );

            return;
        } else {
            doLog(ns, "Expanding %s to %s for %s", tbDivName, city, ns.nFormat(expandCost, "($0.000a)"));
            ns.corporation.expandCity(tbDivName, city);
        }
    }

    // Buy warehouses in all cities
    for (const city of ns.corporation.getDivision(tbDivName).cities) {
        if (!ns.corporation.hasWarehouse(tbDivName, city)) {
            let warehouseCost = ns.corporation.getPurchaseWarehouseCost();
            let corpFunds = ns.corporation.getCorporation().funds;

            if (warehouseCost <= corpFunds) {
                doLog(
                    ns,
                    "Purchasing a %s warehouse in %s for %s",
                    tbDivName,
                    city,
                    ns.nFormat(warehouseCost, "($0.000a)")
                );
                ns.corporation.purchaseWarehouse(tbDivName, city);
            } else {
                doLog(
                    ns,
                    "Insufficient funds to purchase a %s warehouse in %s %s < %s",
                    tbDivName,
                    city,
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(warehouseCost, "($0.000a)")
                );
                return;
            }
        }

        // upgrade the size of the warehouses in all of the cities to 1000
        while (ns.corporation.getWarehouse(tbDivName, city).size < 1000) {
            let upgradeCost = ns.corporation.getUpgradeWarehouseCost(tbDivName, city);
            let corpFunds = ns.corporation.getCorporation().funds;
            let startSize = ns.corporation.getWarehouse(tbDivName, city).size;

            if (corpFunds < upgradeCost) {
                doLog(
                    ns,
                    "WARNING: Insufficient funds to purchase a warehouse upgrade %s < %s",
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
            } else {
                ns.corporation.upgradeWarehouse(tbDivName, city);
                let endSize = ns.corporation.getWarehouse(tbDivName, city).size;
                doLog(
                    ns,
                    "Upgraded %s %s's warehouse size from %s to %s for %s",
                    tbDivName,
                    city,
                    ns.nFormat(startSize, "(0.000a)"),
                    ns.nFormat(endSize, "(0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
            }
        }

        ns.corporation.setSmartSupply(tbDivName, city, true);
    }

    // upgrade the office size in every city to 10 and assign jobs
    for (const city of ns.corporation.getDivision(tbDivName).cities) {
        if (ns.corporation.getOffice(tbDivName, city).size >= 10) {
            continue;
        }

        let upgradeCost = ns.corporation.getOfficeSizeUpgradeCost(
            tbDivName,
            city,
            10 - ns.corporation.getOffice(tbDivName, city).size
        );
        let corpFunds = ns.corporation.getCorporation().funds;

        if (corpFunds < upgradeCost) {
            doLog(
                ns,
                "ERROR: Insufficient funds to increase %s %s office size to 10 %s < %s",
                tbDivName,
                city,
                ns.nFormat(corpFunds, "($0.000a)"),
                ns.nFormat(upgradeCost, "($0.000a)")
            );
            return;
        } else {
            doLog(
                ns,
                "Purchasing %d additional office positions in %s %s for %s",
                10 - ns.corporation.getOffice(tbDivName, city).size,
                tbDivName,
                city,
                ns.nFormat(upgradeCost, "($0.000a)")
            );
            ns.corporation.upgradeOfficeSize(tbDivName, city, 10 - ns.corporation.getOffice(tbDivName, city).size);
        }

        while (ns.corporation.getOffice(tbDivName, city).employees.length < 10) {
            ns.corporation.hireEmployee(tbDivName, city);
        }

        await ns.corporation.setAutoJobAssignment(tbDivName, city, "Unassigned", 2);
        await ns.corporation.setAutoJobAssignment(tbDivName, city, "Operations", 2);
        await ns.corporation.setAutoJobAssignment(tbDivName, city, "Engineer", 2);
        await ns.corporation.setAutoJobAssignment(tbDivName, city, "Business", 2);
        await ns.corporation.setAutoJobAssignment(tbDivName, city, "Management", 2);
        await ns.corporation.setAutoJobAssignment(tbDivName, city, "Research & Development", 2);
    }

    // Upgrade Aevum office to 30 employees
    if (ns.corporation.getOffice(tbDivName, tbRDCity).size < 30) {
        let upgradeCost = ns.corporation.getOfficeSizeUpgradeCost(
            tbDivName,
            tbRDCity,
            30 - ns.corporation.getOffice(tbDivName, tbRDCity).size
        );
        let corpFunds = ns.corporation.getCorporation().funds;

        if (corpFunds < upgradeCost) {
            doLog(
                ns,
                "ERROR: Insufficient funds to increase %s %s office size to 30 %s < %s",
                tbDivName,
                tbRDCity,
                ns.nFormat(corpFunds, "($0.000a)"),
                ns.nFormat(upgradeCost, "($0.000a)")
            );
            return;
        } else {
            doLog(
                ns,
                "Purchasing %d additional office positions in %s %s for %s",
                30 - ns.corporation.getOffice(tbDivName, tbRDCity).size,
                tbDivName,
                tbRDCity,
                ns.nFormat(upgradeCost, "($0.000a)")
            );
            ns.corporation.upgradeOfficeSize(
                tbDivName,
                tbRDCity,
                30 - ns.corporation.getOffice(tbDivName, tbRDCity).size
            );
        }

        while (ns.corporation.getOffice(tbDivName, tbRDCity).employees.length < 30) {
            ns.corporation.hireEmployee(tbDivName, tbRDCity);
        }

        for (const employee of ns.corporation.getOffice(tbDivName, tbRDCity).employees)
            ns.corporation.assignJob(tbDivName, tbRDCity, employee, "Unassigned");

        await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Operations", 6);
        await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Engineer", 6);
        await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Business", 6);
        await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Management", 6);
        await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Research & Development", 6);
    }

    leveledUpgrades = [
        "FocusWires",
        "Neural Accelerators",
        "Speech Processor Implants",
        "Nuoptimal Nootropic Injector Implants",
    ];
    for (const upgrade of leveledUpgrades) {
        while (ns.corporation.getUpgradeLevel(upgrade) < 20) {
            let upgradeCost = ns.corporation.getUpgradeLevelCost(upgrade);
            let corpFunds = ns.corporation.getCorporation().funds;

            if (corpFunds < upgradeCost) {
                doLog(
                    ns,
                    "WARNING: Insufficient funds to purchase %s %s < %s",
                    upgrade,
                    ns.nFormat(corpFunds, "($0.000a)"),
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
                break;
            } else {
                doLog(ns, "Purchasing %s upgrade for %s", upgrade, ns.nFormat(upgradeCost, "($0.000a)"));
                ns.corporation.levelUpgrade(upgrade);
            }
        }
    }

    let doUpdate = false;
    let didUpdate = false;
    let productTracker = {};

    // initialize product tracker
    ns.corporation
        .getDivision(tbDivName)
        .products.map((prodname) => ns.corporation.getProduct(tbDivName, prodname))
        .forEach((product) => {
            let mult = Number(product.sCost.slice(3));
            productTracker[product.name] = {
                state: "HOLD", // ["HOLD", "SEARCH", "INC", "DEC"]
                mult: Number(product.sCost.slice(3)),
                min: 0,
                max: 0,
            };
        });
    while (true) {
        let state = ns.corporation.getCorporation().state;

        if (state === "START") {
            doUpdate = true;
        }

        if (state !== "START") {
            doUpdate = false;
            didUpdate = false;
        }

        if (doUpdate && !didUpdate) {
            doLog(ns, "Doing Update");

            // Attempt to max out Wilson Analytics
            while (ns.corporation.getUpgradeLevelCost("Wilson Analytics") < ns.corporation.getCorporation().funds) {
                let upgradeCost = ns.corporation.getUpgradeLevelCost("Wilson Analytics");
                doLog(
                    ns,
                    "Purchasing %s upgrade for %s",
                    "Wilson Analytics",
                    ns.nFormat(upgradeCost, "($0.000a)")
                );
                ns.corporation.levelUpgrade("Wilson Analytics");
            }

            let leveledUpgrades = [
                "Smart Factories",
                "Smart Storage",
                "DreamSense",
                "Nuoptimal Nootropic Injector Implants",
                "Speech Processor Implants",
                "Neural Accelerators",
                "FocusWires",
                "ABC SalesBots",
                "Project Insight",
            ];
            for (const upgrade of leveledUpgrades) {
                let upgradeCount = 0;
                let upgradeCost = 0;
                while (ns.corporation.getUpgradeLevelCost(upgrade) < ns.corporation.getCorporation().funds * 0.01) {
                    upgradeCost += ns.corporation.getUpgradeLevelCost(upgrade);
                    upgradeCount++;
                    ns.corporation.levelUpgrade(upgrade);
                }

                if (upgradeCount > 0) {
                    doLog(
                        ns,
                        "Purchased %dx %s upgrade for %s",
                        upgradeCount,
                        upgrade,
                        ns.nFormat(upgradeCost, "($0.000a)")
                    );
                }
            }

            let maxProducts = 3;
            if (ns.corporation.hasResearched(tbDivName, "uPgrade: Capacity.I")) maxProducts++;
            if (ns.corporation.hasResearched(tbDivName, "uPgrade: Capacity.II")) maxProducts++;

            // Develop a product if there are none in development
            let products = ns.corporation
                .getDivision(tbDivName)
                .products.map((prodname) => ns.corporation.getProduct(tbDivName, prodname))
                .sort((a, b) => Number(a.name.slice(5)) - Number(b.name.slice(5)));

            let productIsDeveloping = false;
            for (const product of products) {
                if (product.developmentProgress < 100) {
                    productIsDeveloping = true;
                    break;
                }
            }

            // if there are no products in development, discontinue the oldest one if needed
            if (!productIsDeveloping) {
                if (products.length === maxProducts) {
                    doLog(ns, "Discontinuing %s product %s", tbDivName, products[0].name);

                    ns.corporation.discontinueProduct(tbDivName, products[0].name);
                }

                let investmentCash = ns.corporation.getCorporation().funds * 0.01;

                let productName = "prod-0";
                let newMult = 1;
                if (products.length > 0) {
                    productName = "prod-" + (Number(products[products.length - 1].name.slice(5)) + 1).toString();
                }

                if (products.length > 1) {
                    newMult = Number(products[products.length - 2].sCost.slice(3));
                }

                doLog(
                    ns,
                    "Developing new %s product %s for %s",
                    tbDivName,
                    productName,
                    ns.nFormat(investmentCash * 2, "($0.000a)")
                );

                ns.corporation.makeProduct(tbDivName, tbRDCity, productName, investmentCash, investmentCash);
                ns.corporation.sellProduct(tbDivName, tbRDCity, productName, "MAX", "MP*" + newMult.toString(), true);
            }

            products = ns.corporation
                .getDivision(tbDivName)
                .products.map((prodname) => ns.corporation.getProduct(tbDivName, prodname))
                .sort((a, b) => Number(a.name) - Number(b.name));

            // mess with the price of products
            for (const product of products) {
                if (product.developmentProgress < 100)
                    continue
                let mpMult = Number(product.sCost.slice(3));
                let reduceMult = false;
                let increaseMult = 0;
                for (const [key, [qty, prod, sell]] of Object.entries(product.cityData)) {
                    const prodDeficit = prod - sell;
                    if (qty > prod * 20 && prodDeficit > 0) {
                        reduceMult = true;
                        break;
                    } else if (qty < prod * 10 || prodDeficit < -1) {
                        increaseMult++;
                    }
                }

                if (reduceMult) {
                    let oldmpMult = mpMult;
                    mpMult = Math.max(Math.floor(mpMult * 0.9), 1);

                    doLog(ns, "Reducing %s mpMult %d => %d", product.name, oldmpMult, mpMult);
                    ns.corporation.sellProduct(
                        tbDivName,
                        tbRDCity,
                        product.name,
                        "MAX",
                        "MP*" + mpMult.toString(),
                        true
                    );
                } else if (increaseMult === Object.keys(product.cityData).length) {
                    let oldmpMult = mpMult;

                    mpMult = Math.ceil(mpMult * 1.1);

                    doLog(ns, "Increasing %s mpMult %d => %d", product.name, oldmpMult, mpMult);
                    ns.corporation.sellProduct(
                        tbDivName,
                        tbRDCity,
                        product.name,
                        "MAX",
                        "MP*" + mpMult.toString(),
                        true
                    );
                }
            }

            ////////////////////////////////////////
            // look for optimal MP multiplier
            // search state uses binary search to find equilibrium
            // hold state uses small increments up or down to hold diff between -1 and 0
            //
            // Hold Mode:
            // prod = production of the highest producing city
            // if all diffs are <= 0 and all qty are < prod*10, start increasing
            // if any diffs are > 0 start decreasing
            // if all diffs are <= 0 and all qty are < prod*20, hold
            //
            // * start multiplier for new product at the same multiplier for the latest product
            //
            // after research is > 10k, wait for the latest product to finish, find optimal MPMult for that product and get 3rd round of funding
            //
            // after 3rd round of funding, go public with 0 shares, set dividenend to 5%

            // compare price of increasing advertising vs increasing office space, do the cheaper if it's affordable
            let officeSizeIncrease = 0;
            let officeSizePrice = 0;
            let advertIncrease = 0;
            let advertPrice = 0;
            while (true) {
                let advertCost = ns.corporation.getHireAdVertCost(tbDivName);
                let tbRDCityOfficeExpandCost = ns.corporation.getOfficeSizeUpgradeCost(tbDivName, tbRDCity, 15);

                if (
                    advertCost > ns.corporation.getCorporation().funds * 0.5 &&
                    tbRDCityOfficeExpandCost > ns.corporation.getCorporation().funds * 0.5
                )
                    break;

                if (advertCost < tbRDCityOfficeExpandCost) {
                    advertIncrease++;
                    advertPrice += advertCost;
                    ns.corporation.hireAdVert(tbDivName);
                    continue;
                }

                officeSizeIncrease += 15;
                officeSizePrice += tbRDCityOfficeExpandCost;
                ns.corporation.upgradeOfficeSize(tbDivName, tbRDCity, 15);
            }

            if (advertIncrease > 0) {
                doLog(
                    ns,
                    "Hiring %s AdVert %dx for %s",
                    tbDivName,
                    advertIncrease,
                    ns.nFormat(advertPrice, "($0.000a)")
                );
            }

            if (officeSizeIncrease > 0) {
                doLog(
                    ns,
                    "Hiring %d employees in %s:%s for %s",
                    officeSizeIncrease,
                    tbDivName,
                    tbRDCity,
                    ns.nFormat(officeSizePrice, "($0.000a)")
                );
                let officeSize = ns.corporation.getOffice(tbDivName, tbRDCity).size;
                while (ns.corporation.getOffice(tbDivName, tbRDCity).employees.length < officeSize) {
                    ns.corporation.hireEmployee(tbDivName, tbRDCity);
                }

                await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Unassigned", officeSize);

                await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Operations", officeSize / 5);
                await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Engineer", officeSize / 5);
                await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Business", officeSize / 5);
                await ns.corporation.setAutoJobAssignment(tbDivName, tbRDCity, "Management", officeSize / 5);
                await ns.corporation.setAutoJobAssignment(
                    tbDivName,
                    tbRDCity,
                    "Research & Development",
                    officeSize / 5
                );
            }

            // if any of the other office sizes are < 20% the size of the Aevum office, attempt to increase their size
            let cityIncrease = {};
            for (const city of ns.corporation.getDivision(tbDivName).cities) {
                // iterate as long as this city's office size is less than 20% of Aevum's and the price
                // of upgrading is less than 5% of the corporation's funds
                while (
                    ns.corporation.getOffice(tbDivName, city).size <
                        ns.corporation.getOffice(tbDivName, tbRDCity).size * 0.2 &&
                    ns.corporation.getOfficeSizeUpgradeCost(tbDivName, city, 5) <
                        ns.corporation.getCorporation().funds * 0.05
                ) {
                    let cost = ns.corporation.getOfficeSizeUpgradeCost(tbDivName, city, 5);
                    ns.corporation.upgradeOfficeSize(tbDivName, city, 5);

                    if (!(city in cityIncrease)) {
                        cityIncrease[city] = {
                            inc: 5,
                            cost: cost,
                        };
                    } else {
                        cityIncrease[city].inc += 5;
                        cityIncrease[city].cost += cost;
                    }
                }
            }

            for (const [city, val] of Object.entries(cityIncrease)) {
                doLog(
                    ns,
                    "Hiring %d employees in %s:%s for %s",
                    val.inc,
                    tbDivName,
                    city,
                    ns.nFormat(val.cost, "($0.000a)")
                );
                let officeSize = ns.corporation.getOffice(tbDivName, city).size;
                while (ns.corporation.getOffice(tbDivName, city).employees.length < officeSize) {
                    ns.corporation.hireEmployee(tbDivName, city);
                }

                await ns.corporation.setAutoJobAssignment(tbDivName, city, "Unassigned", officeSize);

                await ns.corporation.setAutoJobAssignment(tbDivName, city, "Operations", officeSize / 5);
                await ns.corporation.setAutoJobAssignment(tbDivName, city, "Engineer", officeSize / 5);
                await ns.corporation.setAutoJobAssignment(tbDivName, city, "Business", officeSize / 5);
                await ns.corporation.setAutoJobAssignment(tbDivName, city, "Management", officeSize / 5);
                await ns.corporation.setAutoJobAssignment(tbDivName, city, "Research & Development", officeSize / 5);
            }

            didUpdate = true;
        }

        await ns.sleep(20);
    }

    doLog(ns, "**** DONE ****");
    return;

    for (const div of corp.divisions) {
        doLog(ns, "%s: %s - %s", corp.name, div.name, div.type);
        const products = div.products.map((prodname) => ns.corporation.getProduct(div.name, prodname));

        for (const product of products) {
            const marketFactor = Math.max(0.1, (product.dmd * (100 - product.cmp)) / 100);
            doLog(ns, "  %s:", product.name);
            //doLog(ns, "      Development Progress: %s", product.developmentProgress)
            doLog(ns, "      Market Price: %s", ns.nFormat(product.pCost, "($0.000a)"));
            doLog(
                ns,
                "      Sell Cost: %s",
                typeof product.sCost === "string" ? product.sCost : ns.nFormat(product.sCost, "($0.000a)")
            );
            doLog(ns, "      Competition: %.2f", product.cmp);
            doLog(ns, "      Demand: %.2f", product.dmd);
            doLog(ns, "      Market Factor: %.2f", marketFactor);

            let mult = 32;
            for (const [key, [qty, prod, sell]] of Object.entries(product.cityData)) {
                const prodDeficit = prod + 0.00000001 - sell;
                doLog(
                    ns,
                    "        %10s: qty: %-6.2f prod: %-6.2f sell: %-6.2f diff: %-6.2f",
                    key,
                    qty,
                    prod,
                    sell,
                    prodDeficit
                );
                //ns.corporation.sellProduct(div.name, key, product.name, prod * 2, product.pCost * mult + mult.toString(), false);
                mult += 10;
            }
        }
    }
}
