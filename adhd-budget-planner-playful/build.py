#!/usr/bin/env python3
"""Assemble the planner from the shop's starter template + src/ parts."""
import pathlib, re, sys
here = pathlib.Path(__file__).parent
TPL = pathlib.Path(sys.argv[1])
t = TPL.read_text()
name, key, prefix = 'ADHD Budget Planner', 'adhdBudgetPlayfulData_v1', 'adhd-budget-planner'
t = t.replace('__PLANNER_NAME__', name).replace('__STORAGE_KEY__', key).replace('__BACKUP_PREFIX__', prefix)
head = t[:t.index('</style>')]
script = t[t.index('<script>\n(function(){'):]
util = script[script.index('  /* ============================================================\n     UTILITIES'):script.index('  /* ============================================================\n     STATE')]
feedback = script[script.index('  /* ============================================================\n     FEEDBACK'):script.index('  /* ============================================================\n     RENDERING')]
consts = ("  var STORAGE_KEY = '%s';\n  var BACKUP_PREFIX = '%s';\n  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;\n" % (key, prefix))
out = (head + (here/'src/app.css').read_text() + '\n</style>\n</head>\n' + (here/'src/body.html').read_text() +
       "\n<script>\n(function(){\n  'use strict';\n" + consts + util + feedback + (here/'src/app.js').read_text() + "})();\n</script>\n</body>\n</html>\n")
(here/'adhd-budget-planner.html').write_text(out)
print('ok', len(out))
