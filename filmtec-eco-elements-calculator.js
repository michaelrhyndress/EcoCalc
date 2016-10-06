//Copyright © The Dow Chemical Company (1995-2016). All Rights Reserved.

'use strict';

var APP = window.APP = window.APP || {};

APP.filmtecEcoElementsCalculator = (function () {

    var DEBUG;

    var bindEventsToUI = function ($component) {
        DEBUG = $component.data('local-mode') === "debug" ? true : false;

        var fw = new filmtecWizard($component),
            $printBtn = $component.find("[data-action=print]");
        fw.init();

        if ($printBtn.length) {
            $printBtn.on("click", function() {
                fw.print();
            });
        }
    };

    function filmtecWizard($component) {
            // Navigation Controls
        var $currentStep = undefined,
            $backBtn = $component.find("[data-action=back]"),
            $nextBtn = $component.find("[data-action=next]"),
            $allSteps = $component.find('[data-step]'), 
            //step1 object to get setting values)
            s1,
            // Final step Controls
            $checkboxControls = $component.find("[data-action=checkboxControls]").find("input[type=checkbox]"),
            $scenarioFrames = $component.find(".cl-filmtec-eco-elements-calculator__step__content--final__scenario"),
            // Data
            $dataModel = new data();

        this.init = function() {
            //Data Model and test
            $dataModel.create();
            $dataModel.test();

            //Steps
            s1 = new step1Controller();
            s1.init();
            new step2Controller().init();
            new step3Controller().init();

            //Navigation control
            new navigation().init();
        }

        this.print = function() {
            //Should make a template for print
            var $resultsDiv = $component.find("[data-action=printable]"),
                $defaultVals = $resultsDiv.find("[data-id=defaultValues]"),
                $finalSav = $resultsDiv.find("[data-id=FinalSavings]"),
                mywindow = window.open('', "Results", 'height=400,width=600'),
                $printable;
            mywindow.document.write("<style>table { margin-bottom:10px; text-align: center; } div, table, table tr td, table tr th { page-break-inside: avoid; }</style>");
            mywindow.document.write("<h2 style='text-align: center;'>SUMMARY</h2><hr />");
            mywindow.document.write("<div style='color: black; display: block; width: 100%;'>"+$defaultVals.html() + "</div><hr />");
            mywindow.document.write("<div style='color: black; margin-top: 20px; float:left; display: inline; width: 100%;'>" + $finalSav.html() + "</div>");

            // make inputs printable
            $checkboxControls.filter(":checked").each(function () {
                $printable = cleanInputs($resultsDiv.find("[data-id="+this.id+"]").clone());
                mywindow.document.write("<div style='color:darkgray; float:left; display:inline; width:49%;'>"+$printable.html()+"</div><br />");
            });            
            mywindow.document.close(); // necessary for IE >= 10
            mywindow.focus(); // necessary for IE >= 10
            mywindow.print();
            mywindow.close();

            function cleanInputs(d) {
                $('input', d).each(function() {
                  $("<span />", { text: this.value, "class":"view" }).insertAfter(this);
                  $(this).hide();
                });
                return d;
            }

            return true;
        }

        function navigation() {
            this.init = function() {
                $currentStep = $allSteps.first();

                $backBtn.on("click", function() {
                    prev();
                });
                $nextBtn.on("click", function() {
                    next();
                });

                //Final step
                $checkboxControls.each(function() {
                    $(this).on("click", function(e) {
                        toggleScenario( e.target.id );
                    });
                });

                render();
            }

            function render() {
            
                if ($currentStep != undefined) {
                    $allSteps.hide();
                    $currentStep.show();
                    handleBackForward();
                    focusFirstInput($currentStep);
                    buttonsToggle();
                } else {
                    console.error("Current step is undefined.");
                }
            }

            function prev() {
                var cur = $currentStep.data("step"),
                    prev = parseInt(cur-1);
                $currentStep = $allSteps.eq(prev);
                render();
            }

            function next() {
                var cur = $currentStep.data("step"),
                    next = parseInt(cur+1);
                if( cur <= $allSteps.length ){
                    $currentStep = $allSteps.eq(next);
                }
                render();
            }

            function toggleScenario(id) {
                var $this = $scenarioFrames.filter("[data-id="+id+"]").first(),
                    $finalBox = $scenarioFrames.filter("[data-id=FinalSavings]"),
                    $printBtn = $component.find("[data-action=print]"),
                    $controls = $finalBox.add($printBtn);
                $this.toggle();

                if($checkboxControls.filter(":checked").length) {
                    $controls.show();
                }
                else {
                    $controls.hide();
                }
                //Focus on first input in frame
                focusFirstInput($this);
            } 

            function handleBackForward() {
                window.location.hash = "#"+ $currentStep.data("step");
                $(window).on('hashchange', function() {
                    if (window.location.hash != "#"+ $currentStep.data("step")) {
                        if (window.location.hash > "#"+ $currentStep.data("step")) {
                            if ($nextBtn.is(":visible")) {
                                next();
                            }
                        } else {
                            if ($backBtn.is(":visible")) {
                                prev();
                            }
                        }
                    }
                });
            }

            function buttonsToggle() {
                if ( $currentStep.is($allSteps.first()) ) {
                    $backBtn.hide();
                    $nextBtn.show();
                }
                else if ( $currentStep.is($allSteps.last()) ) {
                    $nextBtn.hide();
                    $backBtn.show();
                }
                else {
                    $backBtn.show();
                    $nextBtn.show();
                }
            }

            function focusFirstInput($container) {
                $container.find("input, .select-convert").first().focus();
            }
        }

        function data() {
            var dataModel;

            this.create = function() {
                dataModel = {
                    step1: {
                        input: {
                            currency: $allSteps.eq(0).find("[data-type=input]").filter("#currency"),
                            units: $allSteps.eq(0).find("[data-type=input]").filter("#unitOfMeasurement")
                        }
                    },
                    step2: {
                        pass1: {
                            roElements: $allSteps.eq(1).find("[data-col=1pass][data-row=roElements]").find("[data-type=input]").first(),
                            flowRate: $allSteps.eq(1).find("[data-col=1pass][data-row=flowRate]").find("[data-type=input]").first()
                        },
                        pass2: {
                            roElements: $allSteps.eq(1).find("[data-col=2pass][data-row=roElements]").find("[data-type=input]").first(),
                            flowRate: $allSteps.eq(1).find("[data-col=2pass][data-row=flowRate]").find("[data-type=input]").first()
                        },
                        utilization: {
                            utilization: $allSteps.eq(1).find("[data-col=utilization][data-row=utilization]").find("[data-type=input]").first(),
                            lifetime: $allSteps.eq(1).find("[data-col=utilization][data-row=lifetime]").find("[data-type=input]").first()
                        },
                        prices: {
                            energy: $allSteps.eq(1).find("[data-col=prices][data-row=energy]").find("[data-type=input]").first(),
                            caustic: $allSteps.eq(1).find("[data-col=prices][data-row=caustic]").find("[data-type=input]").first(),
                            h2so4: $allSteps.eq(1).find("[data-col=prices][data-row=h2so4]").find("[data-type=input]").first(),
                            hci: $allSteps.eq(1).find("[data-col=prices][data-row=hci]").find("[data-type=input]").first()
                        }
                    },
                    step3: {
                        defaults: {
                            pass1: {
                                roElements: $allSteps.eq(2).find("[data-col=1pass][data-row=roElements]").find("[data-type=output]").first(),
                                flowRate: $allSteps.eq(2).find("[data-col=1pass][data-row=flowRate]").find("[data-type=output]").first()
                            },
                            pass2: {
                                roElements: $allSteps.eq(2).find("[data-col=2pass][data-row=roElements]").find("[data-type=output]").first(),
                                flowRate: $allSteps.eq(2).find("[data-col=2pass][data-row=flowRate]").find("[data-type=output]").first()
                            },
                            utilization: {
                                utilization: $allSteps.eq(2).find("[data-col=utilization][data-row=utilization]").find("[data-type=output]").first(),
                                lifetime: $allSteps.eq(2).find("[data-col=utilization][data-row=lifetime]").find("[data-type=output]").first()
                            },
                            prices: {
                                energy: $allSteps.eq(2).find("[data-col=prices][data-row=energy]").find("[data-type=output]").first(),
                                caustic: $allSteps.eq(2).find("[data-col=prices][data-row=caustic]").find("[data-type=output]").first(),
                                h2so4: $allSteps.eq(2).find("[data-col=prices][data-row=h2so4]").find("[data-type=output]").first(),
                                hci: $allSteps.eq(2).find("[data-col=prices][data-row=hci]").find("[data-type=output]").first()
                            }
                        },
                        ROMB: {
                            output: {
                                row1: {
                                    totalEcoSavings: $scenarioFrames.filter("[data-id=FinalSavings]")
                                                                    .find("[data-col=totalEcoSavings][data-row=1]")
                                                                    .find("[data-type=output]").first(),
                                    totalSavings: $scenarioFrames.filter("[data-id=FinalSavings]")
                                                                    .find("[data-col=totalSavings][data-row=1]")
                                                                    .find("[data-type=output]").first(),
                                    totalSavingsLabel: $scenarioFrames.filter("[data-id=FinalSavings]")
                                                                    .find("[data-col=totalSavings][data-row=1]")
                                                                    .find("[data-type=label]").first(),
                                    savingsOverYear: $scenarioFrames.filter("[data-id=FinalSavings]")
                                                                    .find("[data-col=savingsOverLife][data-row=1]")
                                                                    .find("[data-type=output]").first()
                                },
                                row2: {
                                    savingsOverYearLabel: $scenarioFrames.filter("[data-id=FinalSavings]")
                                                                    .find("[data-col=savingsOverLife][data-row=2]")
                                                                    .find("[data-type=label]").first(),
                                    savingsOverYear: $scenarioFrames.filter("[data-id=FinalSavings]")
                                                                    .find("[data-col=savingsOverLife][data-row=2]")
                                                                    .find("[data-type=output]").first()
                                }
                            }
                        },
                        ro: {
                            pass1: {
                                input: {
                                    startup: {
                                        cu: {
                                            feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=start-up][data-col=cu][data-id=feed-p]")
                                                                  .find("[data-type=input]").first(),
                                            energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=start-up][data-col=cu][data-id=energy]")
                                                                  .find("[data-type=input]").first(),
                                            tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=start-up][data-col=cu][data-id=tds]")
                                                                  .find("[data-type=input]").first()
                                        },
                                        eco: {
                                            feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=start-up][data-col=eco][data-id=feed-p]")
                                                                  .find("[data-type=input]").first(),
                                            energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=start-up][data-col=eco][data-id=energy]")
                                                                  .find("[data-type=input]").first(),
                                            tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=start-up][data-col=eco][data-id=tds]")
                                                                  .find("[data-type=input]").first()
                                        }
                                    },
                                    longterm: {
                                        cu: {
                                            feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=long-term][data-col=cu][data-id=feed-p]")
                                                                  .find("[data-type=input]").first(),
                                            energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=long-term][data-col=cu][data-id=energy]")
                                                                  .find("[data-type=input]").first(),
                                            tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=long-term][data-col=cu][data-id=tds]")
                                                                  .find("[data-type=input]").first()
                                        },
                                        eco: {
                                            feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=long-term][data-col=eco][data-id=feed-p]")
                                                                  .find("[data-type=input]").first(),
                                            energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=long-term][data-col=eco][data-id=energy]")
                                                                  .find("[data-type=input]").first(),
                                            tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=1pass]")
                                                                  .find("[data-row=long-term][data-col=eco][data-id=tds]")
                                                                  .find("[data-type=input]").first()
                                        }
                                    }
                                },
                                output: {
                                    startup: {
                                        feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=1pass]")
                                                              .find("[data-row=start-up][data-col=out][data-id=feed-p]")
                                                              .find("[data-type=output]").first(),
                                        energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=1pass]")
                                                              .find("[data-row=start-up][data-col=out][data-id=energy]")
                                                              .find("[data-type=output]").first(),
                                        tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=1pass]")
                                                              .find("[data-row=start-up][data-col=out][data-id=tds]")
                                                              .find("[data-type=output]").first()
                                    },
                                    longterm: {
                                        feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=1pass]")
                                                              .find("[data-row=long-term][data-col=out][data-id=feed-p]")
                                                              .find("[data-type=output]").first(),
                                        energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=1pass]")
                                                              .find("[data-row=long-term][data-col=out][data-id=energy]")
                                                              .find("[data-type=output]").first(),
                                        tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=1pass]")
                                                              .find("[data-row=long-term][data-col=out][data-id=tds]")
                                                              .find("[data-type=output]").first()
                                    }
                                }
                            },
                            pass2: {
                                input: {
                                    startup: {
                                        cu: {
                                            feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=start-up][data-col=cu][data-id=feed-p]")
                                                                  .find("[data-type=input]").first(),
                                            energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=start-up][data-col=cu][data-id=energy]")
                                                                  .find("[data-type=input]").first(),
                                            tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=start-up][data-col=cu][data-id=tds]")
                                                                  .find("[data-type=input]").first()
                                        },
                                        eco: {
                                            feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=start-up][data-col=eco][data-id=feed-p]")
                                                                  .find("[data-type=input]").first(),
                                            energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=start-up][data-col=eco][data-id=energy]")
                                                                  .find("[data-type=input]").first(),
                                            tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=start-up][data-col=eco][data-id=tds]")
                                                                  .find("[data-type=input]").first()
                                        }
                                    },
                                    longterm: {
                                        cu: {
                                            feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=long-term][data-col=cu][data-id=feed-p]")
                                                                  .find("[data-type=input]").first(),
                                            energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=long-term][data-col=cu][data-id=energy]")
                                                                  .find("[data-type=input]").first(),
                                            tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=long-term][data-col=cu][data-id=tds]")
                                                                  .find("[data-type=input]").first()
                                        },
                                        eco: {
                                            feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=long-term][data-col=eco][data-id=feed-p]")
                                                                  .find("[data-type=input]").first(),
                                            energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=long-term][data-col=eco][data-id=energy]")
                                                                  .find("[data-type=input]").first(),
                                            tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=2pass]")
                                                                  .find("[data-row=long-term][data-col=eco][data-id=tds]")
                                                                  .find("[data-type=input]").first()
                                        }
                                    }
                                },
                                output: {
                                    startup: {
                                        feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=2pass]")
                                                              .find("[data-row=start-up][data-col=out][data-id=feed-p]")
                                                              .find("[data-type=output]").first(),
                                        energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=2pass]")
                                                              .find("[data-row=start-up][data-col=out][data-id=energy]")
                                                              .find("[data-type=output]").first(),
                                        tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=2pass]")
                                                              .find("[data-row=start-up][data-col=out][data-id=tds]")
                                                              .find("[data-type=output]").first()
                                    },
                                    longterm: {
                                        feedP: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=2pass]")
                                                              .find("[data-row=long-term][data-col=out][data-id=feed-p]")
                                                              .find("[data-type=output]").first(),
                                        energy: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=2pass]")
                                                              .find("[data-row=long-term][data-col=out][data-id=energy]")
                                                              .find("[data-type=output]").first(),
                                        tds: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=2pass]")
                                                              .find("[data-row=long-term][data-col=out][data-id=tds]")
                                                              .find("[data-type=output]").first()
                                    }
                                }
                            },
                            savings: {
                                output: {
                                    pass1: {
                                        energy: {
                                            cu: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=1pass][data-col=energy][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=1pass][data-col=energy][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        },
                                        price: {
                                            cu: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=1pass][data-col=price][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=1pass][data-col=price][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        }
                                    },
                                    pass2: {
                                        energy: {
                                            cu: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=2pass][data-col=energy][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=2pass][data-col=energy][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        },
                                        price: {
                                            cu: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=2pass][data-col=price][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=2pass][data-col=price][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        }
                                    },
                                    total: {
                                        energy: {
                                            cu: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=total][data-col=energy][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=total][data-col=energy][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        },
                                        price: {
                                            cu: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=total][data-col=price][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=total][data-col=price][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        }
                                    },
                                    energysavings: {
                                        overtime: {
                                            year: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=potential-savings]")
                                                                  .find("[data-col=energysavings][data-id=year]")
                                                                  .find("[data-type=output]").first(),
                                            royear: $allSteps.eq(2).find("[data-id=ROEnergySaving]")
                                                                  .find("[data-section=potential-savings]")
                                                                  .find("[data-col=energysavings][data-id=royear]")
                                                                  .find("[data-type=output]").first()
                                        }
                                    }
                                }
                            }
                        },
                        mb: {
                            pass1: {
                                input: {
                                    caustic: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=1pass]")
                                                            .find("[data-row=caustic]")
                                                            .find("[data-type=input]").first(),
                                    h2so4: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=1pass]")
                                                            .find("[data-row=h2so4]")
                                                            .find("[data-type=input]").first(),
                                    hci: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=1pass]")
                                                            .find("[data-row=hci]")
                                                            .find("[data-type=input]").first()
                                }
                            },
                            pass2: {
                                input: {
                                    cu: {
                                        tbr: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=2pass]")
                                                            .find("[data-col=cu][data-row=tbr]")
                                                            .find("[data-type=input]").first()
                                    },
                                    eco: {
                                        tbr: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=2pass]")
                                                            .find("[data-col=eco][data-row=tbr]")
                                                            .find("[data-type=input]").first()
                                    }
                                },
                                output: {
                                    cu: {
                                        rpy: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=2pass]")
                                                            .find("[data-col=cu][data-row=rpy]")
                                                            .find("[data-type=output]").first()
                                    },
                                    eco: {
                                        rpy: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=2pass]")
                                                            .find("[data-col=eco][data-row=rpy]")
                                                            .find("[data-type=output]").first()
                                    },
                                    savings: {
                                        regenerations: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=2pass]")
                                                            .find("[data-col=energysavings][data-id=regenerations]")
                                                            .find("[data-type=output]").first()
                                    }
                                }
                            },
                            pass3: {
                                output: {
                                    usage: {
                                        caustic: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=3pass]")
                                                            .find("[data-col=usage][data-row=caustic]")
                                                            .find("[data-type=output]").first(),
                                        h2so4: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=3pass]")
                                                            .find("[data-col=usage][data-row=h2so4]")
                                                            .find("[data-type=output]").first(),
                                        hci: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=3pass]")
                                                            .find("[data-col=usage][data-row=hci]")
                                                            .find("[data-type=output]").first(),
                                        total: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=3pass]")
                                                            .find("[data-col=usage][data-row=total]")
                                                            .find("[data-type=output]").first()
                                    },
                                    cost: {
                                        caustic: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=3pass]")
                                                            .find("[data-col=cost][data-row=caustic]")
                                                            .find("[data-type=output]").first(),
                                        h2so4: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=3pass]")
                                                            .find("[data-col=cost][data-row=h2so4]")
                                                            .find("[data-type=output]").first(),
                                        hci: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=3pass]")
                                                            .find("[data-col=cost][data-row=hci]")
                                                            .find("[data-type=output]").first(),
                                        total: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                            .find("[data-section=3pass]")
                                                            .find("[data-col=cost][data-row=total]")
                                                            .find("[data-type=output]").first()
                                    }
                                }
                            },
                            savings: {
                                output: {
                                    caustic: {
                                        energy: {
                                            cu: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=caustic][data-col=energy][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=caustic][data-col=energy][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        },
                                        price: {
                                            cu: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=caustic][data-col=price][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=caustic][data-col=price][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        }
                                    },
                                    h2so4: {
                                        energy: {
                                            cu: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=h2so4][data-col=energy][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=h2so4][data-col=energy][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        },
                                        price: {
                                            cu: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=h2so4][data-col=price][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=h2so4][data-col=price][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        }
                                    },
                                    hci: {
                                        energy: {
                                            cu: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=hci][data-col=energy][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=hci][data-col=energy][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        },
                                        price: {
                                            cu: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=hci][data-col=price][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=hci][data-col=price][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        }
                                    },
                                    total: {
                                        energy: {
                                            cu: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=total][data-col=energy][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=total][data-col=energy][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        },
                                        price: {
                                            cu: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=total][data-col=price][data-id=cu]")
                                                              .find("[data-type=output]").first(),
                                            eco: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                              .find("[data-section=potential-savings]")
                                                              .find("[data-row=total][data-col=price][data-id=eco]")
                                                              .find("[data-type=output]").first()
                                        }
                                    },
                                    energysavings: {
                                        overtime: {
                                            year: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                                  .find("[data-section=potential-savings]")
                                                                  .find("[data-col=energysavings][data-id=year]")
                                                                  .find("[data-type=output]").first(),
                                            royear: $allSteps.eq(2).find("[data-id=MBChemicalSaving]")
                                                                  .find("[data-section=potential-savings]")
                                                                  .find("[data-col=energysavings][data-id=royear]")
                                                                  .find("[data-type=output]").first()
                                        }
                                    }
                                }
                            }
                        }
                    }
                };
            }

            this.test = function() {
                if (!dataModel){
                    if (DEBUG) { console.log("Caution: Cannot evaluate DataModel as it is not defined."); }
                    return true;
                }

                var check = $()
                    .add(dataModel.step1)
                    .add(dataModel.step2)
                    .add(dataModel.step3.defaults)
                    //ROMB
                    .add(dataModel.step3.ROMB.output)
                    //ro
                    .add(dataModel.step3.ro.pass1.input.startup)
                    .add(dataModel.step3.ro.pass1.input.longterm)
                    .add(dataModel.step3.ro.pass1.output)
                    .add(dataModel.step3.ro.pass2.input.startup)
                    .add(dataModel.step3.ro.pass2.input.longterm)
                    .add(dataModel.step3.ro.pass2.output)
                    .add(dataModel.step3.ro.savings.output.pass1)
                    .add(dataModel.step3.ro.savings.output.pass2)
                    .add(dataModel.step3.ro.savings.output.total)
                    .add(dataModel.step3.ro.savings.output.energysavings)
                    //mb
                    .add(dataModel.step3.mb.pass1)
                    .add(dataModel.step3.mb.pass2.input)
                    .add(dataModel.step3.mb.pass2.output)
                    .add(dataModel.step3.mb.pass3.output)
                    .add(dataModel.step3.mb.savings.output.caustic)
                    .add(dataModel.step3.mb.savings.output.h2so4)
                    .add(dataModel.step3.mb.savings.output.hci)
                    .add(dataModel.step3.mb.savings.output.total)
                    .add(dataModel.step3.mb.savings.output.energysavings);

                check.map(function(i, val) {
                    test(val);
                });
                

                function test(toCheck) {
                    for (var table in toCheck) {
                        if (toCheck.hasOwnProperty(table)) {
                            var tableObj = toCheck[table];
                            for (var field in tableObj) {
                                if (tableObj.hasOwnProperty(field)) {
                                    if (!tableObj[field].length) {
                                        console.error("ERROR: Could not find "+ field + " field in " + table + " table.");
                                        if (DEBUG) { console.log(toCheck); }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            this.get = function() {
                return dataModel;
            }
        }

        function step1Controller() {

            var currency = new Currency(),
                units = new Units();
            
            function currencyDomInit() {
                var ppw = this.getPricePerWeight();
                var symbol = this.getSymbol();
                $allSteps.find("[data-type=pricePerWeight]").each(function () {
                    $(this).html(ppw);
                });

                $allSteps.find("[data-type=price]").each(function () {
                    $(this).html(symbol);
                });
            };

            function unitsDomInit() {
                var dataTypes = [
                    "weight",
                    "weightUsage",
                    "volume",
                    "pressure",
                    "energyFlow"
                ];
                for (var i = 0; i < dataTypes.length; i++) {
                    var type = dataTypes[i];
                    var fmt = this.format(type);
                    $allSteps.find("[data-type=" + type + "]").each(function() {
                        $(this).html(fmt);
                    });
                }
            }

            this.init = function () {

                units.init($dataModel.get().step1.input.units.index(), unitsDomInit);
                currency.init($dataModel.get().step1.input.currency.index(), units, currencyDomInit);

                $dataModel.get().step1.input.currency.on("change", function() {
                    currency.change(this.value);
                });

                $dataModel.get().step1.input.units.on("change", function() {
                    units.change(this.value);
                    currency.change();
                });
            }

            this.currency = function() {
                return currency.current() !== null ?  currency.current().id : null;
            }
            this.unitOfMeasurement = function() {
                return units.current() !== null ? units.current().id : null;
            }
        }

        function step2Controller() {

            this.init = function() {
                bindDefaultTable();
            }

            function bindDefaultTable() {
                var step2 = $dataModel.get().step2,
                    defaults = $dataModel.get().step3.defaults;

                for (var table in step2) {
                    if (step2.hasOwnProperty(table) && defaults.hasOwnProperty(table)) {
                        var tableObj = step2[table];
                        var defaultTable = defaults[table];
                        for (var field in tableObj) {
                            if (tableObj.hasOwnProperty(field) && defaultTable.hasOwnProperty(field)) {
                                bindTo(tableObj[field], defaultTable[field]);
                            }
                        }
                    }
                }

                function bindTo($el1, $el2) {
                    $el1.on("keyup change click", function(e) {
                        var val = $(this).val();
                        $el2.text((val > 0) ? val : 0);
                    });
                }
            }
        }

        function step3Controller() {
            var scenarios = new scenarios();

            this.init = function() {
                scenarios.init();
            }

            function scenarios() {
                var ROMB = new ROMB(),
                    ro = new ro(),
                    mb = new mb();
                   

                this.init = function() {
                    ROMB.init();
                    ro.init();
                    mb.init();
                }

                function ro() {
                    var p1, p2, ps;
                    this.init = function() {
                        // passes
                        p1 = new pass(
                            $dataModel.get().step3.ro.pass1.input,
                            $dataModel.get().step3.ro.pass1.output
                        );

                        p2 = new pass(
                            $dataModel.get().step3.ro.pass2.input,
                            $dataModel.get().step3.ro.pass2.output
                        );

                        p1.init();
                        p2.init();

                        // potential savings
                        ps = new potentialSavings()
                        ps.init();
                    }

                    function pass(inputs, outputs) {
                        this.init = function() {
                            initRow(inputs.startup, outputs.startup);
                            initRow(inputs.longterm, outputs.longterm);
                        }

                        function initRow(i, o) {
                            var cu = i.cu,
                                eco = i.eco,
                                output = o,
                                percentage = new percentCalculator(),
                                calculate = function() {
                                    perform(cu.feedP, eco.feedP, output.feedP);
                                    perform(cu.energy, eco.energy, output.energy);
                                    perform(cu.tds, eco.tds, output.tds);

                                    function perform(i1, i2, out) {
                                        var decimal = 0;
                                        if (i1.val() && i2.val()) {
                                            decimal = percentage.decimal( i1.val(), i2.val() );
                                        }
                                        if (isFinite(decimal))  {
                                            out.text( percentage.toPercent(decimal, 1) );
                                        }
                                    }
                                };
                            bindInputsTable(i, calculate);
                        }
                    }

                    function potentialSavings(inputs, output) {

                        this.init = function() {
                            var PSController = new calculatePS();
                            PSController.init();
                        }

                        function calculatePS() {
                            var s3ROData = $dataModel.get().step3.ro,
                                s2Data = $dataModel.get().step2,
                                outputs = s3ROData.savings.output,
                                utilization = s2Data.utilization.utilization,
                                psController;

                            this.init = function() {
                                psController = new psController().init();

                            }

                            function psController() {
                                var cu1, cu2,
                                    eco1, eco2,
                                    totalCu1, totalCu2,
                                    totalEco1, totalEco2,
                                    eSavings;

                                this.init = function () {
                                    cu1 = new cu(s3ROData.pass1, s2Data.pass1, outputs.pass1);
                                    cu1.init();

                                    cu2 = new cu(s3ROData.pass2, s2Data.pass2, outputs.pass2);
                                    cu2.init();

                                    eco1 = new eco(s3ROData.pass1, s2Data.pass1, outputs.pass1);
                                    eco1.init();

                                    eco2 = new eco(s3ROData.pass2, s2Data.pass2, outputs.pass2);
                                    eco2.init();

                                    totalCu1 = new totalE(cu1, cu2, outputs.total.energy.cu);
                                    totalCu1.init();

                                    totalEco1 = new totalE(eco1, eco2, outputs.total.energy.eco);
                                    totalEco1.init();

                                    totalCu2 = new totalP(cu1, cu2, outputs.total.price.cu);
                                    totalCu2.init();

                                    totalEco2 = new totalP(eco1, eco2, outputs.total.price.eco);
                                    totalEco2.init();

                                    eSavings = new energySavings();
                                    eSavings.init();
                                }

                                function totalE(p1, p2, out) {
                                    var calculate,
                                        value,
                                        bindables;

                                    this.init = function() {
                                        calculate = function() {
                                            value = p1.currentEnergy() + p2.currentEnergy();
                                            placeValue(value, out);
                                        }
                                        bindables = $().add(p1.bindables()).add(p2.bindables());
                                        bindInputElements(bindables, calculate);
                                        bindInputsTable($dataModel.get().step1, calculate);
                                    }
                                    this.value = function() {
                                        return value;
                                    }
                                    this.bindables = function() {
                                        return bindables;
                                    }
                                }

                                function totalP(p1, p2, out) {
                                    var calculate,
                                        value,
                                        bindables;

                                    this.init = function() {
                                        calculate = function() {
                                            value = p1.currentPrice() + p2.currentPrice();
                                            placeValue(value, out);
                                        }

                                        bindables = $().add(p1.bindables()).add(p2.bindables());
                                        bindInputElements(bindables, calculate);
                                        bindInputsTable($dataModel.get().step1, calculate);
                                    }
                                    this.value = function() {
                                        return value;
                                    }
                                    this.bindables = function() {
                                        return bindables;
                                    }
                                }

                                function energySavings() {
                                    var yearV, royearV, calculate, bindables;

                                    this.init = function() {
                                        calculate = function() {
                                            yearV = totalCu2.value() - totalEco2.value();
                                            placeValue(yearV, s3ROData.savings.output.energysavings.overtime.year);
                                            royearV = yearV / ( toDec(s2Data.pass1.roElements.val()) + toDec(s2Data.pass2.roElements.val()) );
                                            placeValue(royearV, s3ROData.savings.output.energysavings.overtime.royear);
                                            ROMB.refresh();
                                        };
                                        bindables = $().add(totalCu2.bindables()).add(totalEco2.bindables());
                                        bindInputElements(bindables, calculate);
                                    }
                                    this.yearValue = function() {
                                        return yearV;
                                    }
                                    this.royearValue = function() {
                                        return royearV;
                                    }
                                    this.bindables = function() {
                                        return bindables;
                                    }
                                }

                                function cu(pass, dft, out) {
                                    var su, lt, calculate, pOut, energyValue, pValue, bindables;

                                    this.init = function() {
                                        su = pass.input.startup.cu.energy;
                                        lt = pass.input.longterm.cu.energy;
                                        pOut = out.price.cu;
                                        out = out.energy.cu;
                                        calculate = function() {
                                            energyValue = calculateEnergyFlow(su, lt, dft.flowRate);
                                            placeValue(energyValue, out);

                                            pValue = calculatePrice(energyValue);
                                            placeValue(pValue, pOut);
                                        };
                                        bindables = $().add(su).add(lt);
                                        bindInputElements(bindables, calculate);
                                        bindInputsTable(dft, calculate);
                                        bindInputsTable($dataModel.get().step1, calculate);
                                    }
                                    this.currentEnergy = function() {
                                        return energyValue;
                                    }
                                    this.currentPrice = function() {
                                        return pValue;
                                    }
                                    this.bindables = function() {
                                        return bindables;
                                    }
                                }

                                function eco(pass, dft, out) {
                                    var su, lt, calculate, pOut,  energyValue, pValue, bindables;

                                    this.init = function() {
                                        su = pass.input.startup.eco.energy;
                                        lt = pass.input.longterm.eco.energy;
                                        pOut = out.price.eco;
                                        out = out.energy.eco;
                                        calculate = function() {
                                            energyValue = calculateEnergyFlow(su, lt, dft.flowRate);
                                            placeValue(energyValue, out);

                                            pValue = calculatePrice(energyValue);
                                            placeValue(pValue, pOut);
                                        };
                                        bindables = $().add(su).add(lt);
                                        bindInputElements(bindables, calculate);
                                        bindInputsTable(dft, calculate);
                                        bindInputsTable($dataModel.get().step1, calculate);
                                    }
                                    this.currentEnergy = function() {
                                        return energyValue;
                                    }
                                    this.currentPrice = function() {
                                        return pValue;
                                    }
                                    this.bindables = function() {
                                        return bindables;
                                    }
                                }

                                function getUtilization() {
                                    return ((toDec(utilization.val()) / 100) * 8760);
                                }

                                function calculateAverage(i1, i2) {
                                    i1 = toDec(i1);
                                    i2 = toDec(i2);
                                    return ((i1 + i2) / 2);
                                }

                                function calculateEnergyFlow(su, lt, $flowrate) {
                                    var output, avEnergy, flowRate, util;
                                    avEnergy = flowRate = util = output = 0;

                                    util = getUtilization();
                                    avEnergy = calculateAverage(su.val(), lt.val());
                                    flowRate = toDec($flowrate.val());
                                    
                                    if (s1.unitOfMeasurement() != 0) {
                                        avEnergy = avEnergy / 1000;
                                        flowRate = flowRate * 60;
                                    }

                                    output = (avEnergy * flowRate * util);
                                    return output || 0;
                                }

                                function calculatePrice(eq) {
                                    return eq * toDec(s2Data.prices.energy.val());
                                }
                            }
                        }
                    }
                }

                //not as pretty, but not as complex as RO code
                function mb() {
                    var pass1,
                        pass2,
                        ps,
                        s3MBData,
                        s2Data;

                    this.init = function() {
                        s3MBData = $dataModel.get().step3.mb;
                        s2Data = $dataModel.get().step2;

                        pass1 = new pass1(s3MBData.pass1.input, s3MBData.pass3.output);
                        pass2 = new pass2(s3MBData.pass2.input, s3MBData.pass2.output);
                        ps = new potentialSavings(s3MBData.savings.output);

                        pass1.init();
                        pass2.init();
                        ps.init();
                    }

                    function pass1(i, out) {
                        var calculate,
                            causticU,
                            h2so4U,
                            hciU,
                            totalU,
                            causticC,
                            h2so4C,
                            hciC,
                            totalC,
                            data;

                        this.init = function() {
                            calculate = function() {
                                //Usage
                                causticU    = (toDec(i.caustic.val()) / 0.5);
                                h2so4U      = (toDec(i.h2so4.val()) / 0.95);
                                hciU        = (toDec(i.hci.val()) / 0.35);
                                totalU      = (causticU + h2so4U + hciU);

                                placeValue(causticU, out.usage.caustic, 2);
                                placeValue(h2so4U, out.usage.h2so4, 2);
                                placeValue(hciU, out.usage.hci, 2);
                                placeValue(totalU, out.usage.total, 2);

                                //Cost
                                if (s1.unitOfMeasurement() == 0){
                                    causticC    = ( (toDec(s2Data.prices.caustic.val()) / 1000) * causticU );
                                    h2so4C      = ( (toDec(s2Data.prices.h2so4.val()) / 1000) * h2so4U );
                                    hciC        = ( (toDec(s2Data.prices.hci.val()) / 1000) * hciU );
                                    totalC      = (causticC + h2so4C + hciC);
                                }
                                else {
                                    causticC    = toDec(s2Data.prices.caustic.val()) * causticU;
                                    h2so4C      = toDec(s2Data.prices.h2so4.val()) * h2so4U;
                                    hciC        = toDec(s2Data.prices.hci.val()) * hciU;
                                    totalC      = (causticC + h2so4C + hciC);
                                }

                                placeValue(causticC, out.cost.caustic, 2);
                                placeValue(h2so4C, out.cost.h2so4, 2);
                                placeValue(hciC, out.cost.hci, 2);
                                placeValue(totalC, out.cost.total, 2);

                                data = {
                                    output: {
                                        usage: {
                                            caustic: causticU,
                                            h2so4: h2so4U,
                                            hci: hciU,
                                            total: totalU
                                        },
                                        cost: {
                                            caustic: causticC,
                                            h2so4: h2so4C,
                                            hci: hciC,
                                            total: totalC
                                        }   
                                    }
                                };
                            };
                            bindInputsTable(s2Data.prices, calculate);
                            bindInputsTable(i, calculate);
                            bindInputsTable($dataModel.get().step1, calculate);
                        }
                        this.get = function() {
                            return data;
                        }
                    }

                    function pass2(i, out) {
                        var calculate,
                            cuT,
                            ecoT,
                            regT,
                            data;

                        this.init = function() {
                            calculate = function() {
                                var util = (toDec(s2Data.utilization.utilization.val()) / 100) * 8760,
                                    pc = new percentCalculator(),
                                    regT = 0;
                                cuT     = util / toDec(i.cu.tbr.val());    // = (8760 * (mAssetUtilization / 100)) / mS3.s35_timeElements
                                ecoT    = util / toDec(i.eco.tbr.val());   // = (8760 * (mAssetUtilization / 100)) / mS3.s35_timeECO

                                placeValue(cuT, out.cu.rpy, 1);
                                placeValue(ecoT, out.eco.rpy, 1);

                                //total
                                regT = toDec(pc.toPercent((ecoT - cuT) / cuT, 1));
                                placeValue(regT, out.savings.regenerations, 1);

                                data = {
                                    output: {
                                        cu: {
                                            rpy: cuT,
                                        },
                                        eco: {
                                            rpy: ecoT,
                                        },
                                        savings: {
                                            regenerations: regT
                                        }
                                    }
                                };
                            }

                            bindInputsTable(s2Data.utilization, calculate);
                            bindInputsTable(i, calculate);
                        }

                        this.get = function() {
                            return data;
                        }
                    }

                    function potentialSavings(out) {
                        var calculate;

                        this.init = function() {
                            calculate = function() {
                                //A function should be made for this

                                //caustic 
                                //cu
                                var cu1Caustic = pass2.get().output.cu.rpy *  pass1.get().output.usage.caustic
                                placeValue(cu1Caustic, out.caustic.energy.cu );
                                
                                var cu2Caustic = cu1Caustic;
                                if (s1.unitOfMeasurement() === 0) {
                                    cu2Caustic = cu2Caustic / 1000;
                                }
                                cu2Caustic = cu2Caustic * toDec(s2Data.prices.caustic.val());
                                placeValue(cu2Caustic, out.caustic.price.cu );

                                //eco
                                var eco1Caustic = (pass2.get().output.eco.rpy *  pass1.get().output.usage.caustic)
                                placeValue(eco1Caustic, out.caustic.energy.eco );

                                var eco2Caustic = eco1Caustic;
                                if (s1.unitOfMeasurement() === 0) {
                                    eco2Caustic = eco2Caustic / 1000;
                                }
                                eco2Caustic = eco2Caustic * toDec(s2Data.prices.caustic.val());
                                placeValue(eco2Caustic, out.caustic.price.eco );


                                //H2SO4 
                                //cu
                                var cu1H2SO4 = pass2.get().output.cu.rpy *  pass1.get().output.usage.h2so4
                                placeValue(cu1H2SO4, out.h2so4.energy.cu );
                                
                                var cu2H2SO4 = cu1H2SO4;
                                if (s1.unitOfMeasurement() === 0) {
                                    cu2H2SO4 = cu2H2SO4 / 1000;
                                }
                                cu2H2SO4 = cu2H2SO4 * toDec(s2Data.prices.h2so4.val());
                                placeValue(cu2H2SO4, out.h2so4.price.cu );

                                //eco
                                var eco1H2SO4 = (pass2.get().output.eco.rpy *  pass1.get().output.usage.h2so4)
                                placeValue(eco1H2SO4, out.h2so4.energy.eco );

                                var eco2H2SO4 = eco1H2SO4;
                                if (s1.unitOfMeasurement() === 0) {
                                    eco2H2SO4 = eco2H2SO4 / 1000;
                                }
                                eco2H2SO4 = eco2H2SO4 * toDec(s2Data.prices.h2so4.val());
                                placeValue(eco2H2SO4, out.h2so4.price.eco );


                                //HCI 
                                //cu
                                var cu1HCI = pass2.get().output.cu.rpy *  pass1.get().output.usage.hci
                                placeValue(cu1HCI, out.hci.energy.cu );
                                
                                var cu2HCI = cu1HCI;
                                if (s1.unitOfMeasurement() === 0) {
                                    cu2HCI = cu2HCI / 1000;
                                }
                                cu2HCI = cu2HCI * toDec(s2Data.prices.hci.val());
                                placeValue(cu2HCI, out.hci.price.cu );

                                //eco
                                var eco1HCI = (pass2.get().output.eco.rpy *  pass1.get().output.usage.hci)
                                placeValue(eco1HCI, out.hci.energy.eco );

                                var eco2HCI = eco1HCI;
                                if (s1.unitOfMeasurement() === 0) {
                                    eco2HCI = eco2HCI / 1000;
                                }
                                eco2HCI = eco2HCI * toDec(s2Data.prices.hci.val());
                                placeValue(eco2HCI, out.hci.price.eco );

                                var cu1Total = cu1HCI + cu1H2SO4 + cu1Caustic;
                                var cu2Total = cu2HCI + cu2H2SO4 + cu2Caustic;
                                var eco1Total = eco1HCI + eco1H2SO4 + eco1Caustic;
                                var eco2Total = eco2HCI + eco2H2SO4 + eco2Caustic;

                                placeValue(cu1Total , out.total.energy.cu );
                                placeValue(eco1Total , out.total.energy.eco );
                                placeValue(cu2Total , out.total.price.cu );
                                placeValue(eco2Total , out.total.price.eco );

                                // Final
                                var yearTotal = cu2Total - eco2Total;
                                var yearROELTotal = yearTotal / (toDec(s2Data.pass1.roElements.val()) + toDec(s2Data.pass2.roElements.val()));
                                placeValue(yearTotal, out.energysavings.overtime.year);
                                placeValue(yearROELTotal, out.energysavings.overtime.royear);

                                ROMB.refresh();
                            };

                            bindInputsTable(
                                $().add(s3MBData.pass1.input)
                                    .add(s3MBData.pass2.input.cu)
                                    .add(s3MBData.pass2.input.eco)
                                , calculate
                            );
                            bindInputsTable(s2Data.prices, calculate);
                        }
                    }
                }

                function ROMB(ro, mb) {
                    var ROMBOut,
                        s3ROData,
                        s3MBData;

                    this.init = function() {
                        ROMBOut = $dataModel.get().step3.ROMB.output;
                        s3ROData = $dataModel.get().step3.ro.savings.output.energysavings.overtime;
                        s3MBData = $dataModel.get().step3.mb.savings.output.energysavings.overtime;
                    }

                    this.refresh = function() {
                        var roOn = $checkboxControls.filter("#ROEnergySaving").is(":checked"),
                            mbOn = $checkboxControls.filter("#MBChemicalSaving").is(":checked"),
                            ROMB_totalSavingsYear,
                            ROMB_totalSavingsLife,
                            ROMB_totalSavingsElementsYear,
                            ROMB_totalSavingsElementsMultipleYears,
                            lifetime, roEl1, roEl2,
                            mb_year,
                            ro_year;

                        ROMB_totalSavingsYear = ROMB_totalSavingsLife = ROMB_totalSavingsElementsYear = lifetime = roEl1 = roEl2 = mb_year = ro_year = 0;

                        ro_year = Number(s3ROData.year.text().replace(/[^0-9\.-]+/g,""));
                        mb_year = Number(s3MBData.year.text().replace(/[^0-9\.-]+/g,""));

                        if (roOn && mbOn) {
                            ROMB_totalSavingsYear = (mb_year || 0) + (ro_year || 0);
                        }
                        else if (mbOn) {
                            ROMB_totalSavingsYear = (mb_year || 0);
                        }
                        else if (roOn) {
                            ROMB_totalSavingsYear = (ro_year || 0);
                        }

                        lifetime = toDec($dataModel.get().step2.utilization.lifetime.val());
                        roEl1 = toDec($dataModel.get().step2.pass1.roElements.val());
                        roEl2 = toDec($dataModel.get().step2.pass2.roElements.val());
                        ROMB_totalSavingsLife = (ROMB_totalSavingsYear * lifetime);
                        ROMB_totalSavingsElementsYear = ROMB_totalSavingsYear / (roEl1 + roEl2);
                        ROMB_totalSavingsElementsMultipleYears = ROMB_totalSavingsLife / (roEl1 + roEl2);
                        
                        placeValue(lifetime, ROMBOut.row1.totalSavingsLabel);
                        placeValue(lifetime, ROMBOut.row2.savingsOverYearLabel);

                        placeValue(ROMB_totalSavingsYear, ROMBOut.row1.totalEcoSavings);
                        placeValue(ROMB_totalSavingsLife, ROMBOut.row1.totalSavings);

                        placeValue(ROMB_totalSavingsElementsYear, ROMBOut.row1.savingsOverYear);
                        placeValue(ROMB_totalSavingsElementsMultipleYears, ROMBOut.row2.savingsOverYear);

                    }
                }

                function placeValue(eq, out, fix) {
                    if(!fix) { fix = 0; }
                    out.text( isFinite(eq) ? numberWithCommas(eq.toFixed(fix)) : 0 );
                }

                function numberWithCommas(x) {
                    var parts = x.toString().split(".");
                    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                    return parts.join(".");
                }

                function toDec(i) {
                    return parseFloat(i) || 0;
                }

                function bindInputsTable(ds, calc, onEvent) {
                    for (var table in ds) {
                        if (ds.hasOwnProperty(table)){
                            var tableObj = ds[table];
                            for (var field in tableObj) {
                                if (tableObj.hasOwnProperty(field)) {
                                    $(tableObj[field]).on( (onEvent || "keyup change click"), function(e) {
                                        calc();
                                    });
                                }
                            }
                        }
                    }
                }

                function bindInputElements($ds, bindableFunc, onEvent) {
                    $ds.each(function() {
                        $( this ).on( (onEvent || "keyup change click"), function(e) {
                            bindableFunc();
                        });
                    });
                }

                function percentCalculator() {
                    this.decimal = function(start, end) {
                        return ((end - start) / start)
                    }
                    this.toPercent = function(d, f) {
                        return (d * 100).toFixed(f)
                    }
                }
            }
        }
    }

    function Currency() {
        this.currency = null;
        this.units = null;
        this.domInit = null;
    }

    Currency.prototype.currencies = {
        "eur": { "id": 0, "name": "Euros", "code": "EUR", "symbol": "€" },
        "usd": { "id": 1, "name": "Dollars", "code": "USD", "symbol": "$" }
    }

    Currency.prototype.getPricePerWeight = function () {
        var unitVal = this.units.format("weight");
        return this.getSymbol() + "/" + unitVal;
    }

    Currency.prototype.updateDOM = function () {
        if (this.domInit != null && typeof this.domInit == "function") {
            this.domInit();
        }
    }

    Currency.prototype.change = function (sel) {
        if (typeof sel !== "undefined") {
            var newCurrencyVal = Number(sel);
            var cur = this.current(newCurrencyVal);
            if (DEBUG) console.log("Currency changed to: " + (cur !== null ? cur.name : null));
        }
        this.updateDOM();

    }

    Currency.prototype.init = function (sel, units, domInit) {
        this.units = units;
        this.change(sel);
        this.domInit = domInit;
    }

    Currency.prototype.getCode = function (id) {
        var cur;
        if (typeof id != "undefined" && id !== null) {
            cur = this.lookupCurrency(id);
        } else {
            cur = this.current();
        }
        return cur != null ? cur.code : null;
    }

    Currency.prototype.getSymbol = function (id) {
        var cur;
        if (typeof id != "undefined" && id !== null) {
            cur = this.lookupCurrency(id);
        } else {
            cur = this.current();
        }

        return cur != null ? cur.symbol : null;
    }

    Currency.prototype.lookupCurrency = function (id) {
        var cur;

        $.each(this.currencies, function (key, value) {
            if (typeof id === "number" && value.id === id) {
                cur = value;
                return false;
            }
            return true;
        });

        return cur;
    }

    Currency.prototype.current = function (id) {
        if (typeof id !== "undefined") {
            this.currency = this.lookupCurrency(id);
        }

        return this.currency;
    }


    function Units() {
        this.units = null;
        this.domInit = null;
    }


    Units.prototype.unitTypes = {
        "metric": {
            "id": 0,
            "name": "Metric",
            "weight": { "units": "ton" },
            "weightUsage": { "units": "kg/year" },
            "volume": { "units": "m3", "fmt": "m<sup>3</sup>/h" },
            "pressure": { "units": "bar" },
            "energyFlow": { "units": "m3", "fmt": "kWh/m<sup>3</sup>" }
        },
        "imperial": {
            "id": 1,
            "name": "Imperial",
            "weight": { "units": "lb" },
            "weightUsage": { "units": "lb/year" },
            "volume": { "units": "gpm" },
            "pressure": { "units": "psi" },
            "energyFlow": { "units": "kWh/kgal" }
        }

    };

    Units.prototype.change = function (sel) {
        var newUnit = Number(sel);
        var units = this.current(newUnit);
        if (DEBUG) console.log("Units changed to: " + (units !== null ? units.name : null));
        this.updateDOM();
    }
    Units.prototype.updateDOM = function () {
        if (this.domInit != null && typeof this.domInit == "function") {
            this.domInit();
        }
    }

    Units.prototype.init = function (sel, domInit) {
        this.change(sel);
        this.domInit = domInit;
    }

    Units.prototype.format = function (type, units) {
        var obj = typeof units === "undefined" || units === null ? this.current() : units;

        if (obj != null && typeof obj[type] !== "undefined") {
            var typ = obj[type];
            return typeof typ["fmt"] !== "undefined" ? typ.fmt : typ.units;
        }

        return null;
    }

    Units.prototype.lookupUnit = function (id) {
        var units;

        $.each(this.unitTypes, function (key, value) {
            if (typeof id === "number" && value.id === id) {
                units = value;
                return false;
            }
            return true;
        });

        return units;
    }

    Units.prototype.current = function (id) {
        if (typeof id !== "undefined") {
            this.units = this.lookupUnit(id);
        }

        return this.units;
    }

    var init = function () {
        // uncomment the following line to access the DOM element invoking this component
        // var element = arguments[0];
        bindEventsToUI($(arguments[0]));
    };

    /**
     * interfaces to public functions
     */
    return {
        init: init
    };

}());
