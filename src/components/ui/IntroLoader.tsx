'use client';

import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { motion } from '@/lib/motion';

/**
 * ThinkLab SVG Logo Intro Loader
 *
 * Sequence:
 *  1. FIRST: Connecting line DRAWS down smoothly from top to the bulb,
 *     and as it connects, the bulb illuminates.
 *  2. AFTER THAT: Text ("THINKLAB", "DIGITAL SOLUTIONS") and chart symbol fade in from left to right.
 *  3. AT LAST: Border draws starting from D in DIGITAL and last S in SOLUTIONS,
 *     wrapping symmetrically around the left and right sides to meet at top center.
 *  4. Brief hold on fully illuminated lockup, followed by circular bubble reveal.
 */

// 1. Text & Chart symbols from original SVG
const TEXT_PATH = "M 1103 860 L 1103 907 L 1116 907 L 1116 884 L 1117 883 L 1120 886 L 1120 887 L 1122 889 L 1122 890 L 1124 892 L 1124 893 L 1126 895 L 1126 896 L 1128 898 L 1128 899 L 1130 901 L 1130 902 L 1134 907 L 1148 907 L 1148 860 L 1134 860 L 1134 883 L 1133 884 L 1131 882 L 1131 881 L 1129 879 L 1129 878 L 1127 876 L 1127 875 L 1125 873 L 1125 872 L 1123 870 L 1123 869 L 1121 867 L 1121 866 L 1119 864 L 1119 863 L 1117 861 L 1117 860 Z M 1010 860 L 1010 907 L 1025 907 L 1025 860 Z M 953 860 L 953 872 L 967 872 L 968 873 L 968 907 L 982 907 L 982 873 L 983 872 L 997 872 L 997 860 Z M 895 860 L 895 892 L 896 893 L 896 896 L 897 897 L 898 900 L 903 905 L 904 905 L 907 907 L 915 907 L 916 908 L 923 908 L 924 907 L 928 907 L 929 906 L 932 905 L 937 900 L 937 899 L 939 896 L 939 893 L 940 892 L 940 860 L 926 860 L 925 861 L 925 892 L 924 893 L 924 894 L 922 896 L 920 896 L 919 897 L 915 897 L 914 896 L 913 896 L 911 894 L 911 893 L 909 890 L 909 860 Z M 847 860 L 847 907 L 884 907 L 884 896 L 862 896 L 861 895 L 861 860 Z M 653 860 L 653 907 L 690 907 L 690 896 L 669 896 L 668 895 L 668 860 Z M 609 860 L 608 861 L 608 863 L 607 864 L 607 866 L 605 869 L 605 871 L 604 872 L 604 874 L 602 877 L 602 879 L 601 880 L 601 882 L 599 885 L 599 887 L 598 888 L 598 890 L 596 893 L 596 895 L 595 896 L 595 898 L 594 899 L 594 901 L 592 904 L 592 907 L 606 907 L 606 906 L 607 905 L 607 903 L 608 902 L 608 900 L 609 899 L 624 899 L 626 902 L 626 905 L 627 906 L 627 907 L 642 907 L 642 905 L 641 904 L 641 902 L 639 899 L 639 897 L 638 896 L 638 894 L 636 891 L 636 889 L 635 888 L 635 886 L 633 883 L 633 881 L 632 880 L 632 878 L 630 875 L 630 873 L 629 872 L 629 870 L 627 867 L 627 865 L 626 864 L 626 862 L 625 861 L 625 860 Z M 617 875 L 618 876 L 618 878 L 619 879 L 619 881 L 620 882 L 620 884 L 621 885 L 621 888 L 620 889 L 613 889 L 612 888 L 612 887 L 613 886 L 613 884 L 614 883 L 614 880 L 615 879 L 615 877 Z M 544 860 L 543 861 L 543 871 L 544 872 L 557 872 L 558 873 L 558 907 L 573 907 L 573 873 L 574 872 L 587 872 L 587 860 Z M 515 860 L 515 907 L 530 907 L 530 860 Z M 422 860 L 422 907 L 437 907 L 437 860 Z M 365 860 L 365 907 L 391 907 L 392 906 L 395 906 L 396 905 L 399 904 L 401 902 L 402 902 L 406 896 L 406 894 L 407 893 L 407 888 L 408 887 L 408 881 L 407 880 L 407 874 L 406 873 L 406 872 L 405 871 L 405 869 L 403 867 L 403 866 L 402 866 L 399 863 L 398 863 L 395 861 L 392 861 L 391 860 Z M 380 871 L 387 871 L 388 872 L 389 872 L 392 875 L 392 877 L 393 878 L 393 890 L 390 895 L 389 895 L 388 896 L 385 896 L 384 897 L 380 897 L 379 896 L 379 872 Z M 1173 860 L 1172 861 L 1169 862 L 1167 864 L 1166 864 L 1166 865 L 1163 870 L 1163 876 L 1164 877 L 1164 879 L 1169 884 L 1170 884 L 1171 885 L 1173 885 L 1176 887 L 1179 887 L 1180 888 L 1183 888 L 1184 889 L 1186 889 L 1190 893 L 1190 894 L 1189 895 L 1189 896 L 1187 898 L 1185 898 L 1184 899 L 1182 899 L 1181 898 L 1179 898 L 1176 895 L 1176 893 L 1175 892 L 1175 891 L 1162 891 L 1161 892 L 1162 893 L 1162 897 L 1163 898 L 1164 901 L 1168 905 L 1169 905 L 1170 906 L 1172 906 L 1173 907 L 1177 907 L 1178 908 L 1185 908 L 1186 907 L 1191 907 L 1192 906 L 1194 906 L 1195 905 L 1198 904 L 1201 901 L 1201 900 L 1203 897 L 1203 894 L 1204 893 L 1204 890 L 1203 889 L 1203 886 L 1201 884 L 1201 883 L 1196 879 L 1194 879 L 1193 878 L 1191 878 L 1190 877 L 1187 877 L 1186 876 L 1183 876 L 1182 875 L 1179 875 L 1176 872 L 1176 871 L 1179 868 L 1184 868 L 1187 870 L 1187 871 L 1188 872 L 1188 874 L 1197 874 L 1198 873 L 1202 873 L 1202 871 L 1201 870 L 1201 868 L 1200 867 L 1200 866 L 1196 862 L 1195 862 L 1192 860 L 1187 860 L 1186 859 L 1179 859 L 1178 860 Z M 1053 861 L 1052 862 L 1049 863 L 1044 868 L 1044 869 L 1042 871 L 1042 873 L 1041 874 L 1041 877 L 1040 878 L 1040 889 L 1041 890 L 1041 893 L 1042 894 L 1042 895 L 1043 896 L 1044 899 L 1049 904 L 1050 904 L 1053 906 L 1055 906 L 1056 907 L 1061 907 L 1062 908 L 1067 908 L 1068 907 L 1073 907 L 1074 906 L 1076 906 L 1077 905 L 1078 905 L 1080 903 L 1081 903 L 1084 900 L 1084 899 L 1086 897 L 1086 896 L 1087 895 L 1087 892 L 1088 891 L 1088 876 L 1087 875 L 1087 873 L 1086 872 L 1086 871 L 1085 870 L 1084 867 L 1081 864 L 1080 864 L 1078 862 L 1077 862 L 1076 861 L 1074 861 L 1073 860 L 1069 860 L 1068 859 L 1061 859 L 1060 860 L 1056 860 L 1055 861 Z M 1062 870 L 1066 870 L 1067 871 L 1070 872 L 1072 874 L 1072 875 L 1073 876 L 1073 878 L 1074 879 L 1074 888 L 1073 889 L 1073 891 L 1072 892 L 1072 893 L 1069 896 L 1068 896 L 1067 897 L 1062 897 L 1061 896 L 1060 896 L 1056 892 L 1056 891 L 1055 890 L 1055 886 L 1054 885 L 1054 881 L 1055 880 L 1055 877 L 1056 876 L 1056 875 L 1060 871 L 1061 871 Z M 797 861 L 796 862 L 793 863 L 787 869 L 787 870 L 786 871 L 786 873 L 785 874 L 785 876 L 784 877 L 784 889 L 785 890 L 785 893 L 786 894 L 786 896 L 787 897 L 787 898 L 793 904 L 794 904 L 797 906 L 799 906 L 800 907 L 805 907 L 806 908 L 811 908 L 812 907 L 817 907 L 818 906 L 820 906 L 821 905 L 822 905 L 824 903 L 825 903 L 828 900 L 828 899 L 830 897 L 830 895 L 831 894 L 831 892 L 832 891 L 832 876 L 831 875 L 831 873 L 830 872 L 829 869 L 825 864 L 824 864 L 822 862 L 820 862 L 819 861 L 817 861 L 816 860 L 812 860 L 811 859 L 805 859 L 804 860 L 800 860 L 799 861 Z M 806 870 L 810 870 L 811 871 L 814 872 L 816 874 L 816 875 L 817 876 L 817 879 L 818 880 L 818 887 L 817 888 L 817 891 L 816 892 L 816 893 L 813 896 L 812 896 L 811 897 L 806 897 L 805 896 L 804 896 L 799 891 L 799 888 L 798 887 L 798 881 L 799 880 L 799 877 L 800 876 L 800 875 L 804 871 L 805 871 Z M 737 862 L 735 864 L 734 864 L 734 865 L 732 868 L 732 870 L 731 871 L 731 876 L 732 877 L 733 880 L 736 883 L 737 883 L 739 885 L 741 885 L 742 886 L 744 886 L 745 887 L 747 887 L 748 888 L 751 888 L 752 889 L 754 889 L 758 893 L 758 895 L 755 898 L 753 898 L 752 899 L 750 899 L 745 896 L 745 895 L 744 894 L 743 891 L 730 891 L 729 892 L 730 893 L 730 896 L 731 897 L 731 899 L 735 904 L 736 904 L 738 906 L 740 906 L 741 907 L 745 907 L 746 908 L 753 908 L 754 907 L 759 907 L 760 906 L 763 906 L 765 904 L 766 904 L 769 901 L 769 900 L 771 897 L 771 895 L 772 894 L 772 890 L 771 889 L 771 886 L 770 885 L 770 884 L 767 881 L 766 881 L 764 879 L 762 879 L 761 878 L 759 878 L 758 877 L 755 877 L 754 876 L 751 876 L 750 875 L 747 875 L 745 873 L 745 870 L 747 868 L 752 868 L 755 870 L 755 871 L 757 874 L 765 874 L 766 873 L 770 873 L 770 871 L 769 870 L 769 868 L 768 867 L 768 866 L 764 862 L 763 862 L 760 860 L 755 860 L 754 859 L 747 859 L 746 860 L 741 860 L 740 861 Z M 468 860 L 467 861 L 465 861 L 464 862 L 463 862 L 461 864 L 460 864 L 457 867 L 457 868 L 455 870 L 455 871 L 454 872 L 454 874 L 453 875 L 453 878 L 452 879 L 452 888 L 453 889 L 453 893 L 454 894 L 454 895 L 455 896 L 456 899 L 461 904 L 462 904 L 465 906 L 467 906 L 468 907 L 473 907 L 474 908 L 482 908 L 483 907 L 487 907 L 488 906 L 490 906 L 491 905 L 492 905 L 493 904 L 496 903 L 498 901 L 499 901 L 500 900 L 500 880 L 477 880 L 477 890 L 486 890 L 487 891 L 487 894 L 482 897 L 473 897 L 468 892 L 468 890 L 467 889 L 467 877 L 468 876 L 468 875 L 473 870 L 476 870 L 477 869 L 478 869 L 479 870 L 481 870 L 485 874 L 485 875 L 487 875 L 488 874 L 493 874 L 494 873 L 499 873 L 499 871 L 498 870 L 498 868 L 496 866 L 496 865 L 495 864 L 494 864 L 492 862 L 491 862 L 488 860 L 484 860 L 483 859 L 475 859 L 474 860 Z M 1076 684 L 1076 687 L 1077 688 L 1077 690 L 1078 691 L 1078 693 L 1079 694 L 1079 697 L 1080 698 L 1080 700 L 1081 701 L 1081 703 L 1082 704 L 1082 706 L 1083 707 L 1083 709 L 1084 710 L 1084 712 L 1085 713 L 1085 715 L 1086 716 L 1086 717 L 1089 717 L 1092 715 L 1094 715 L 1095 714 L 1097 714 L 1098 713 L 1101 713 L 1102 712 L 1105 712 L 1106 711 L 1110 711 L 1111 710 L 1121 710 L 1122 709 L 1133 709 L 1134 710 L 1139 710 L 1140 711 L 1143 711 L 1144 712 L 1145 712 L 1146 713 L 1149 714 L 1156 721 L 1156 722 L 1158 725 L 1158 727 L 1159 728 L 1159 732 L 1160 733 L 1160 738 L 1159 739 L 1158 739 L 1157 738 L 1155 738 L 1154 737 L 1151 737 L 1150 736 L 1148 736 L 1147 735 L 1142 735 L 1141 734 L 1134 734 L 1133 733 L 1115 733 L 1114 734 L 1105 734 L 1104 735 L 1101 735 L 1100 736 L 1097 736 L 1096 737 L 1094 737 L 1093 738 L 1091 738 L 1090 739 L 1089 739 L 1088 740 L 1087 740 L 1086 741 L 1083 742 L 1081 744 L 1080 744 L 1078 746 L 1077 746 L 1072 751 L 1072 752 L 1068 757 L 1068 758 L 1067 759 L 1067 761 L 1066 762 L 1066 763 L 1065 764 L 1065 766 L 1064 767 L 1064 770 L 1063 771 L 1063 790 L 1064 791 L 1064 794 L 1065 795 L 1065 798 L 1067 801 L 1067 803 L 1069 805 L 1070 808 L 1074 812 L 1074 813 L 1075 814 L 1076 814 L 1080 818 L 1081 818 L 1083 820 L 1084 820 L 1085 821 L 1086 821 L 1091 824 L 1093 824 L 1094 825 L 1097 825 L 1098 826 L 1102 826 L 1103 827 L 1109 827 L 1110 828 L 1117 828 L 1118 827 L 1126 827 L 1127 826 L 1131 826 L 1132 825 L 1135 825 L 1138 823 L 1140 823 L 1141 822 L 1142 822 L 1143 821 L 1144 821 L 1145 820 L 1148 819 L 1150 817 L 1151 817 L 1159 809 L 1160 810 L 1160 828 L 1201 828 L 1201 732 L 1200 731 L 1200 722 L 1199 721 L 1199 717 L 1198 716 L 1198 713 L 1197 712 L 1197 710 L 1196 709 L 1196 707 L 1195 706 L 1195 705 L 1194 704 L 1194 703 L 1193 702 L 1193 701 L 1192 700 L 1191 697 L 1188 694 L 1188 693 L 1181 686 L 1180 686 L 1177 683 L 1176 683 L 1175 682 L 1172 681 L 1170 679 L 1168 679 L 1167 678 L 1165 678 L 1164 677 L 1162 677 L 1161 676 L 1159 676 L 1158 675 L 1154 675 L 1153 674 L 1148 674 L 1147 673 L 1117 673 L 1116 674 L 1111 674 L 1110 675 L 1105 675 L 1104 676 L 1100 676 L 1099 677 L 1096 677 L 1095 678 L 1093 678 L 1092 679 L 1090 679 L 1089 680 L 1087 680 L 1086 681 L 1084 681 L 1081 683 L 1079 683 L 1078 684 Z M 1161 765 L 1160 766 L 1161 767 L 1160 768 L 1160 771 L 1161 772 L 1160 773 L 1160 778 L 1159 779 L 1159 781 L 1158 782 L 1158 783 L 1156 785 L 1156 786 L 1151 791 L 1150 791 L 1145 795 L 1143 795 L 1142 796 L 1140 796 L 1139 797 L 1136 797 L 1135 798 L 1120 798 L 1119 797 L 1117 797 L 1116 796 L 1114 796 L 1112 794 L 1111 794 L 1106 789 L 1106 788 L 1105 787 L 1105 785 L 1104 784 L 1104 775 L 1105 774 L 1105 772 L 1106 771 L 1106 770 L 1110 765 L 1111 765 L 1114 762 L 1116 762 L 1119 760 L 1122 760 L 1123 759 L 1129 759 L 1130 758 L 1137 758 L 1138 759 L 1144 759 L 1145 760 L 1150 760 L 1151 761 L 1153 761 L 1154 762 L 1156 762 Z M 1232 564 L 1232 827 L 1270 827 L 1270 780 L 1271 779 L 1272 780 L 1273 780 L 1275 782 L 1276 782 L 1278 784 L 1281 785 L 1283 787 L 1284 787 L 1289 791 L 1292 792 L 1297 796 L 1300 797 L 1302 799 L 1302 827 L 1314 827 L 1314 808 L 1315 807 L 1316 807 L 1318 809 L 1321 810 L 1326 814 L 1332 814 L 1333 813 L 1337 813 L 1338 812 L 1341 812 L 1342 811 L 1344 811 L 1345 812 L 1345 827 L 1357 827 L 1357 809 L 1360 807 L 1364 807 L 1365 806 L 1367 806 L 1368 805 L 1372 805 L 1381 814 L 1381 815 L 1388 822 L 1388 827 L 1407 827 L 1407 826 L 1373 792 L 1370 792 L 1369 793 L 1365 793 L 1364 794 L 1361 794 L 1360 795 L 1356 795 L 1355 796 L 1351 796 L 1350 797 L 1347 797 L 1346 798 L 1343 798 L 1342 799 L 1338 799 L 1337 800 L 1333 800 L 1332 801 L 1329 801 L 1328 802 L 1326 800 L 1323 799 L 1321 797 L 1320 797 L 1318 795 L 1317 795 L 1312 791 L 1309 790 L 1307 788 L 1306 788 L 1301 784 L 1298 783 L 1293 779 L 1290 778 L 1287 775 L 1284 774 L 1282 772 L 1281 772 L 1279 770 L 1278 770 L 1276 768 L 1275 768 L 1274 767 L 1272 767 L 1271 768 L 1271 769 L 1269 771 L 1268 774 L 1266 776 L 1265 775 L 1265 774 L 1263 771 L 1263 769 L 1261 766 L 1261 764 L 1258 759 L 1258 757 L 1255 752 L 1255 750 L 1253 747 L 1253 745 L 1254 744 L 1263 744 L 1264 743 L 1286 743 L 1287 744 L 1281 753 L 1283 755 L 1284 755 L 1289 759 L 1292 760 L 1294 762 L 1295 762 L 1300 766 L 1303 767 L 1308 771 L 1311 772 L 1313 774 L 1314 774 L 1319 778 L 1322 779 L 1324 781 L 1325 781 L 1330 785 L 1331 785 L 1332 784 L 1336 784 L 1337 783 L 1340 783 L 1341 782 L 1345 782 L 1346 781 L 1349 781 L 1350 780 L 1353 780 L 1354 779 L 1358 779 L 1359 778 L 1362 778 L 1363 777 L 1366 777 L 1367 776 L 1371 776 L 1372 775 L 1375 775 L 1376 774 L 1378 774 L 1405 801 L 1406 801 L 1405 800 L 1405 795 L 1404 794 L 1404 791 L 1403 790 L 1403 786 L 1402 785 L 1402 782 L 1401 781 L 1401 779 L 1400 778 L 1400 776 L 1399 775 L 1399 773 L 1398 772 L 1398 770 L 1396 767 L 1396 765 L 1393 760 L 1393 758 L 1392 757 L 1392 756 L 1391 755 L 1391 754 L 1390 753 L 1389 750 L 1387 748 L 1386 745 L 1384 743 L 1383 740 L 1381 738 L 1381 737 L 1378 734 L 1378 733 L 1375 730 L 1375 729 L 1372 726 L 1372 725 L 1352 705 L 1351 705 L 1347 701 L 1346 701 L 1343 698 L 1342 698 L 1340 696 L 1339 696 L 1334 692 L 1333 692 L 1332 691 L 1331 691 L 1330 690 L 1329 690 L 1328 689 L 1327 689 L 1326 688 L 1325 688 L 1324 687 L 1323 687 L 1322 686 L 1321 686 L 1320 685 L 1319 685 L 1314 682 L 1312 682 L 1309 680 L 1307 680 L 1306 679 L 1304 679 L 1303 678 L 1301 678 L 1300 677 L 1297 677 L 1296 676 L 1294 676 L 1293 675 L 1290 675 L 1289 674 L 1287 674 L 1286 673 L 1286 564 Z M 1313 807 L 1314 806 L 1315 807 L 1314 808 Z M 977 564 L 977 828 L 1032 828 L 1032 564 Z M 782 564 L 782 673 L 781 674 L 778 674 L 777 675 L 774 675 L 773 676 L 770 676 L 769 677 L 767 677 L 766 678 L 764 678 L 763 679 L 761 679 L 760 680 L 758 680 L 755 682 L 753 682 L 752 683 L 751 683 L 750 684 L 749 684 L 748 685 L 747 685 L 746 686 L 745 686 L 744 687 L 743 687 L 742 688 L 741 688 L 740 689 L 739 689 L 738 690 L 735 691 L 733 693 L 732 693 L 730 695 L 729 695 L 727 697 L 726 697 L 724 699 L 723 699 L 720 702 L 719 702 L 715 706 L 714 706 L 695 725 L 695 726 L 689 733 L 689 734 L 687 736 L 687 737 L 685 739 L 685 740 L 681 745 L 681 746 L 680 747 L 679 750 L 677 752 L 677 754 L 675 756 L 675 757 L 674 758 L 674 760 L 673 761 L 673 762 L 671 765 L 671 767 L 669 770 L 669 772 L 668 773 L 668 775 L 667 776 L 667 778 L 666 779 L 666 781 L 665 782 L 665 785 L 664 786 L 664 790 L 663 791 L 663 794 L 662 795 L 662 800 L 661 801 L 661 809 L 660 810 L 660 828 L 715 828 L 715 812 L 716 811 L 716 805 L 717 804 L 717 800 L 718 799 L 718 797 L 719 796 L 719 794 L 720 793 L 720 791 L 721 790 L 721 788 L 722 787 L 722 786 L 725 781 L 725 779 L 726 778 L 726 777 L 728 775 L 729 772 L 732 769 L 732 768 L 734 766 L 734 765 L 737 762 L 737 761 L 750 748 L 751 748 L 758 742 L 759 742 L 761 740 L 762 740 L 763 739 L 766 738 L 768 736 L 769 736 L 774 733 L 776 733 L 777 732 L 779 732 L 780 731 L 781 731 L 782 732 L 782 828 L 837 828 L 837 781 L 838 780 L 838 779 L 852 765 L 853 766 L 853 767 L 855 769 L 856 772 L 858 774 L 858 775 L 862 780 L 863 783 L 867 788 L 868 791 L 870 793 L 870 794 L 874 799 L 875 802 L 877 804 L 877 805 L 881 810 L 882 813 L 884 815 L 884 816 L 886 818 L 886 819 L 888 821 L 889 824 L 891 826 L 891 827 L 892 828 L 942 828 L 942 827 L 940 825 L 939 822 L 937 820 L 937 819 L 935 817 L 935 816 L 933 814 L 933 813 L 929 808 L 928 805 L 926 803 L 926 802 L 924 800 L 924 799 L 920 794 L 919 791 L 917 789 L 917 788 L 915 786 L 915 785 L 913 783 L 913 782 L 909 777 L 908 774 L 906 772 L 906 771 L 904 769 L 904 768 L 902 766 L 902 765 L 898 760 L 897 757 L 895 755 L 895 754 L 893 752 L 893 751 L 889 746 L 888 743 L 885 740 L 884 737 L 882 735 L 882 734 L 889 727 L 889 726 L 890 725 L 891 725 L 893 723 L 893 722 L 925 690 L 925 689 L 940 674 L 887 674 L 881 680 L 881 681 L 871 691 L 871 692 L 861 702 L 861 703 L 851 713 L 851 714 L 840 725 L 840 726 L 838 728 L 837 727 L 837 564 Z M 151 564 L 151 619 L 244 619 L 245 620 L 245 674 L 246 675 L 245 676 L 245 679 L 246 680 L 245 681 L 245 682 L 246 683 L 245 684 L 245 685 L 246 686 L 245 687 L 245 692 L 246 693 L 245 694 L 245 701 L 246 702 L 245 703 L 245 706 L 246 707 L 245 708 L 245 711 L 246 712 L 245 713 L 245 716 L 246 717 L 245 718 L 245 729 L 246 730 L 245 731 L 245 732 L 246 733 L 245 734 L 245 735 L 246 736 L 245 737 L 245 739 L 246 740 L 246 741 L 245 742 L 245 743 L 246 744 L 245 745 L 245 748 L 246 749 L 245 750 L 245 753 L 246 754 L 245 755 L 245 771 L 246 772 L 245 773 L 245 777 L 246 778 L 245 779 L 245 784 L 246 785 L 245 786 L 245 791 L 246 792 L 245 793 L 245 799 L 246 800 L 245 801 L 245 814 L 246 815 L 245 816 L 245 822 L 246 823 L 245 824 L 245 827 L 246 828 L 300 828 L 300 620 L 301 619 L 358 619 L 359 620 L 359 828 L 414 828 L 414 732 L 415 731 L 416 731 L 417 732 L 419 732 L 424 735 L 426 735 L 428 737 L 429 737 L 430 738 L 431 738 L 432 739 L 435 740 L 438 743 L 439 743 L 441 745 L 442 745 L 445 748 L 446 748 L 456 758 L 456 759 L 461 764 L 461 765 L 463 767 L 463 768 L 466 771 L 467 774 L 469 776 L 469 777 L 470 778 L 470 779 L 473 784 L 473 786 L 475 789 L 475 791 L 476 792 L 476 794 L 477 795 L 477 797 L 478 798 L 478 801 L 479 802 L 479 806 L 480 807 L 480 814 L 481 815 L 481 828 L 536 828 L 536 818 L 535 817 L 535 805 L 534 804 L 534 798 L 533 797 L 533 793 L 532 792 L 532 788 L 531 787 L 531 784 L 530 783 L 530 781 L 529 780 L 529 777 L 528 776 L 528 774 L 526 771 L 526 769 L 525 768 L 525 766 L 522 761 L 522 759 L 521 758 L 521 757 L 520 756 L 520 755 L 519 754 L 518 751 L 516 749 L 516 748 L 515 747 L 514 744 L 512 742 L 512 741 L 510 739 L 510 738 L 508 736 L 508 735 L 506 733 L 506 732 L 502 728 L 502 727 L 498 723 L 498 722 L 484 708 L 483 708 L 478 703 L 477 703 L 474 700 L 473 700 L 470 697 L 469 697 L 467 695 L 464 694 L 462 692 L 459 691 L 457 689 L 456 689 L 455 688 L 454 688 L 453 687 L 452 687 L 447 684 L 445 684 L 440 681 L 438 681 L 435 679 L 433 679 L 432 678 L 430 678 L 429 677 L 426 677 L 425 676 L 423 676 L 422 675 L 419 675 L 418 674 L 415 674 L 414 673 L 414 564 Z";

// 2. Original rectangle border from SVG (clean, without stem)
const BORDER_PATH = "M 106 547 L 106 551 L 105 552 L 105 834 L 106 835 L 106 840 L 107 841 L 107 844 L 108 845 L 108 847 L 109 848 L 109 850 L 110 851 L 110 852 L 111 853 L 111 854 L 112 855 L 112 856 L 113 857 L 114 860 L 116 862 L 116 863 L 118 865 L 118 866 L 128 876 L 129 876 L 132 879 L 133 879 L 135 881 L 136 881 L 139 883 L 141 883 L 146 886 L 148 886 L 149 887 L 152 887 L 153 888 L 157 888 L 158 889 L 321 889 L 321 878 L 167 878 L 166 877 L 157 877 L 156 876 L 153 876 L 150 874 L 148 874 L 147 873 L 146 873 L 145 872 L 144 872 L 143 871 L 140 870 L 137 867 L 136 867 L 127 858 L 127 857 L 123 852 L 123 851 L 120 846 L 120 844 L 119 843 L 119 841 L 118 840 L 118 836 L 117 835 L 117 552 L 118 551 L 118 548 L 119 547 L 119 545 L 120 544 L 120 542 L 121 541 L 121 540 L 122 539 L 122 538 L 123 537 L 124 534 L 126 532 L 126 531 L 131 526 L 131 525 L 132 524 L 133 524 L 139 518 L 140 518 L 141 517 L 142 517 L 143 516 L 144 516 L 149 513 L 151 513 L 152 512 L 154 512 L 155 511 L 159 511 L 160 510 L 594 510 L 603 510 L 1408 510 L 1409 511 L 1413 511 L 1414 512 L 1416 512 L 1417 513 L 1419 513 L 1422 515 L 1424 515 L 1426 517 L 1429 518 L 1435 524 L 1436 524 L 1438 526 L 1438 527 L 1439 527 L 1440 528 L 1440 529 L 1442 531 L 1442 532 L 1446 537 L 1446 539 L 1449 544 L 1449 547 L 1450 548 L 1450 551 L 1451 552 L 1451 826 L 1452 827 L 1451 828 L 1451 837 L 1450 838 L 1450 840 L 1449 841 L 1449 843 L 1448 844 L 1448 846 L 1447 847 L 1447 848 L 1446 849 L 1445 852 L 1441 857 L 1441 858 L 1431 868 L 1430 868 L 1425 872 L 1423 872 L 1420 874 L 1418 874 L 1415 876 L 1412 876 L 1411 877 L 1402 877 L 1401 878 L 1247 878 L 1247 889 L 1411 889 L 1412 888 L 1416 888 L 1417 887 L 1420 887 L 1421 886 L 1423 886 L 1424 885 L 1425 885 L 1426 884 L 1427 884 L 1428 883 L 1429 883 L 1430 882 L 1431 882 L 1432 881 L 1435 880 L 1437 878 L 1438 878 L 1444 872 L 1445 872 L 1445 871 L 1446 870 L 1447 870 L 1447 869 L 1451 865 L 1451 864 L 1455 859 L 1455 858 L 1458 853 L 1458 851 L 1460 848 L 1460 846 L 1461 845 L 1461 842 L 1462 841 L 1462 837 L 1463 836 L 1463 552 L 1462 551 L 1462 547 L 1461 546 L 1461 543 L 1460 542 L 1460 540 L 1459 539 L 1459 537 L 1458 536 L 1458 535 L 1457 534 L 1457 533 L 1456 532 L 1456 531 L 1455 530 L 1454 527 L 1452 525 L 1452 524 L 1450 522 L 1450 521 L 1442 513 L 1441 513 L 1437 509 L 1436 509 L 1434 507 L 1433 507 L 1432 506 L 1431 506 L 1426 503 L 1424 503 L 1421 501 L 1418 501 L 1417 500 L 1414 500 L 1413 499 L 1407 499 L 1406 498 L 163 498 L 162 499 L 156 499 L 155 500 L 151 500 L 150 501 L 147 501 L 144 503 L 142 503 L 141 504 L 140 504 L 139 505 L 136 506 L 134 508 L 131 509 L 127 513 L 126 513 L 120 519 L 120 520 L 116 524 L 116 525 L 114 527 L 114 528 L 113 529 L 113 530 L 112 531 L 112 532 L 109 537 L 109 539 L 108 540 L 108 542 L 107 543 L 107 546 Z";

// 3. Vertical line connecting border to bulb from SVG
const STEM_PATH = "M 595 510 L 595 632 L 594 633 L 592 633 L 588 637 L 588 639 L 587 640 L 587 642 L 609 642 L 609 639 L 608 638 L 607 635 L 602 632 L 602 510 Z";

// 4. White collar, shine and base of bulb from SVG
const BULB_WHITE_PATH = "M 571 766 L 571 825 L 625 825 L 625 766 L 624 767 L 623 767 L 618 770 L 616 770 L 615 771 L 613 771 L 612 772 L 610 772 L 609 773 L 605 773 L 604 774 L 593 774 L 592 773 L 588 773 L 587 772 L 584 772 L 583 771 L 581 771 L 580 770 L 578 770 L 577 769 L 574 768 L 572 766 Z M 570 657 L 570 658 L 568 661 L 568 663 L 566 665 L 566 666 L 563 669 L 563 670 L 559 674 L 559 675 L 556 678 L 555 681 L 553 683 L 553 684 L 550 689 L 550 691 L 549 692 L 549 695 L 548 696 L 548 702 L 547 703 L 547 712 L 548 713 L 548 719 L 549 720 L 549 723 L 550 724 L 550 726 L 551 727 L 551 728 L 552 729 L 552 730 L 553 731 L 554 734 L 556 736 L 556 737 L 559 740 L 559 741 L 565 747 L 566 747 L 569 750 L 570 750 L 572 752 L 573 752 L 576 754 L 578 754 L 579 755 L 580 755 L 581 756 L 583 756 L 584 757 L 587 757 L 588 758 L 592 758 L 593 757 L 593 658 L 594 657 L 593 658 L 592 657 Z M 573 647 L 573 652 L 574 653 L 622 653 L 624 650 L 624 648 L 622 646 L 574 646 Z";

// 5. Gradient bulb body from SVG
const BULB_GRADIENT_PATH = "M 570 657 L 570 659 L 569 660 L 568 663 L 565 666 L 565 667 L 563 669 L 563 671 L 560 673 L 561 673 L 562 674 L 561 675 L 562 676 L 562 678 L 561 679 L 562 680 L 562 682 L 561 683 L 562 684 L 562 686 L 561 687 L 562 688 L 562 690 L 561 691 L 562 692 L 562 694 L 561 695 L 562 696 L 562 698 L 561 699 L 562 700 L 562 702 L 561 703 L 562 704 L 562 706 L 561 707 L 562 708 L 562 710 L 561 711 L 562 712 L 562 714 L 561 715 L 562 716 L 562 718 L 561 719 L 562 720 L 562 722 L 561 723 L 562 724 L 562 726 L 561 727 L 562 728 L 562 730 L 561 731 L 562 732 L 562 734 L 561 735 L 562 736 L 562 738 L 561 739 L 562 740 L 562 742 L 561 743 L 564 746 L 565 746 L 569 750 L 570 750 L 572 752 L 573 752 L 576 754 L 578 754 L 581 756 L 583 756 L 584 757 L 587 757 L 588 758 L 608 758 L 609 757 L 612 757 L 613 756 L 615 756 L 616 755 L 617 755 L 618 754 L 619 754 L 620 753 L 621 753 L 622 752 L 625 751 L 627 749 L 628 749 L 635 742 L 636 742 L 636 741 L 640 737 L 641 734 L 643 732 L 643 731 L 644 730 L 644 728 L 645 727 L 645 726 L 646 725 L 646 723 L 647 722 L 647 719 L 648 718 L 648 712 L 649 711 L 649 703 L 648 702 L 648 696 L 647 695 L 647 693 L 646 692 L 646 690 L 645 689 L 645 687 L 644 686 L 643 683 L 641 681 L 641 680 L 639 678 L 639 677 L 636 674 L 636 673 L 633 670 L 633 669 L 631 667 L 631 666 L 628 663 L 628 662 L 626 659 L 626 657 Z";

export default function IntroLoader() {
  const [gone, setGone] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const stemRef = useRef<SVGPathElement>(null);
  const stemMaskRef = useRef<SVGPathElement>(null);
  const bulbGroupRef = useRef<SVGGElement>(null);
  const textGroupRef = useRef<SVGGElement>(null);
  const borderPathRef = useRef<SVGPathElement>(null);
  const borderMaskLeftRef = useRef<SVGPathElement>(null);
  const borderMaskRightRef = useRef<SVGPathElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    // Lock scroll during intro
    document.documentElement.style.overflow = 'hidden';
    if (typeof window !== 'undefined') {
      window.__lenis?.stop();
    }

    const stem = stemRef.current;
    const stemMask = stemMaskRef.current;
    const bulbGroup = bulbGroupRef.current;
    const textGroup = textGroupRef.current;
    const borderPath = borderPathRef.current;
    const maskLeft = borderMaskLeftRef.current;
    const maskRight = borderMaskRightRef.current;
    if (!stem || !stemMask || !bulbGroup || !textGroup || !borderPath || !maskLeft || !maskRight) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Measure exact lengths for stroke masks
    const lenStem = stemMask.getTotalLength() || 140;
    stemMask.style.strokeDasharray = `${lenStem}`;
    stemMask.style.strokeDashoffset = `${lenStem}`;

    const lenLeft = maskLeft.getTotalLength() || 2500;
    const lenRight = maskRight.getTotalLength() || 2500;
    maskLeft.style.strokeDasharray = `${lenLeft}`;
    maskLeft.style.strokeDashoffset = `${lenLeft}`;
    maskRight.style.strokeDasharray = `${lenRight}`;
    maskRight.style.strokeDashoffset = `${lenRight}`;

    // Initial hidden states
    stem.style.opacity = '0';
    bulbGroup.style.opacity = '0';

    textGroup.style.clipPath = 'inset(0 100% 0 0)';
    textGroup.style.opacity = '0';

    borderPath.style.opacity = '0';

    /* ───────── Build GSAP Timeline ───────── */
    const tl = gsap.timeline({
      paused: true,
      onComplete: () => {
        triggerCircularBubbleReveal();
      },
    });
    tlRef.current = tl;

    // ─────────────────────────────────────────────────────────────
    // STEP 1: First, the connecting line DRAWS down to the bulb
    // ─────────────────────────────────────────────────────────────
    const stemStartTime = 0.1;
    const stemDuration = 0.7;

    // Reveal stem element under stroke mask
    tl.set(stem, { opacity: 1 }, stemStartTime);

    // Physically draw the connecting line downward using strokeDashoffset
    tl.to(
      stemMask,
      {
        strokeDashoffset: 0,
        duration: stemDuration,
        ease: 'power1.inOut',
      },
      stemStartTime
    );

    // Bulb illuminates right as the drawn line reaches the bulb socket
    const bulbStartTime = stemStartTime + stemDuration - 0.08;
    tl.to(
      bulbGroup,
      {
        opacity: 1,
        duration: 0.55,
        ease: 'power2.out',
      },
      bulbStartTime
    );

    // ─────────────────────────────────────────────────────────────
    // STEP 2: After that, the text fades in
    // ─────────────────────────────────────────────────────────────
    const textStartTime = bulbStartTime + 0.55 + 0.15;

    tl.to(
      textGroup,
      {
        clipPath: 'inset(0 0% 0 0)',
        duration: 1.25,
        ease: 'power2.inOut',
      },
      textStartTime
    );

    tl.to(
      textGroup,
      {
        opacity: 1,
        duration: 0.45,
        ease: 'power1.out',
      },
      textStartTime
    );

    // ─────────────────────────────────────────────────────────────
    // STEP 3: At last, the border draws from D in digital and last S in solution
    // ─────────────────────────────────────────────────────────────
    const borderStartTime = textStartTime + 1.25 + 0.1;

    // Reveal border element
    tl.set(borderPath, { opacity: 1 }, borderStartTime);

    // Draw left half (starts from "D" in DIGITAL, goes left, up, and to top center)
    tl.to(
      maskLeft,
      {
        strokeDashoffset: 0,
        duration: 1.35,
        ease: 'power2.inOut',
      },
      borderStartTime
    );

    // Draw right half (starts from last "S" in SOLUTIONS, goes right, up, and to top center)
    tl.to(
      maskRight,
      {
        strokeDashoffset: 0,
        duration: 1.35,
        ease: 'power2.inOut',
      },
      borderStartTime
    );

    // Hold briefly on fully assembled, complete lockup
    tl.to({}, { duration: 0.5 });

    /* ───────── Circular Bubble Expansion Reveal ───────── */
    let revealStarted = false;
    const triggerCircularBubbleReveal = () => {
      if (revealStarted) return;
      revealStarted = true;

      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const maxPortalRadius = (Math.hypot(winW, winH) / 2) * 1.35;
      const portalState = { radius: 0 };

      // Activate homepage components
      motion.ready = true;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('thinklab:ready'));
      }

      gsap.to(portalState, {
        radius: maxPortalRadius,
        duration: 1.45,
        ease: 'power2.inOut',
        onUpdate: () => {
          const rr = portalState.radius;
          if (containerRef.current) {
            const mask = `radial-gradient(circle at 50% 50%, transparent ${rr}px, black ${rr + 2.5}px)`;
            containerRef.current.style.maskImage = mask;
            containerRef.current.style.webkitMaskImage = mask;
          }
        },
        onComplete: () => {
          document.documentElement.style.overflow = '';
          if (typeof window !== 'undefined') {
            window.__lenis?.start();
          }
          setGone(true);
        },
      });
    };

    if (reduceMotion) {
      stem.style.opacity = '1';
      stemMask.style.strokeDashoffset = '0';
      bulbGroup.style.opacity = '1';
      textGroup.style.clipPath = 'inset(0 0 0 0%)';
      textGroup.style.opacity = '1';
      borderPath.style.opacity = '1';
      maskLeft.style.strokeDashoffset = '0';
      maskRight.style.strokeDashoffset = '0';
      triggerCircularBubbleReveal();
    } else {
      tl.play();
    }

    return () => {
      tl.kill();
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] overflow-hidden bg-[#050505] text-white pointer-events-none select-none will-change-transform"
      aria-label="thinklab"
    >
      <div className="grid-bg pointer-events-none absolute inset-0" aria-hidden="true" />

      {/* Centered SVG Logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          viewBox="0 0 1563 1563"
          xmlns="http://www.w3.org/2000/svg"
          className="w-[min(70vw,70vh)] h-[min(70vw,70vh)] max-w-[500px] max-h-[500px]"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="bulbGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#E7E2F0" />
              <stop offset="48%" stopColor="#806DAA" />
              <stop offset="100%" stopColor="#392078" />
            </linearGradient>

            {/* Mask to physically draw the connecting line down from top to the bulb */}
            <mask id="stemDrawMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1563" height="1563">
              <rect width="1563" height="1563" fill="#000000" />
              <path
                ref={stemMaskRef}
                d="M 598.5 508 L 598.5 645"
                fill="none"
                stroke="#ffffff"
                strokeWidth="30"
                strokeLinecap="round"
                strokeDasharray="140"
                strokeDashoffset="140"
                style={{ strokeDasharray: 140, strokeDashoffset: 140 }}
              />
            </mask>

            {/* Mask to draw the actual SVG border path starting from D in digital and last S in solution */}
            <mask id="borderDrawMask" maskUnits="userSpaceOnUse" x="0" y="0" width="1563" height="1563">
              <rect width="1563" height="1563" fill="#000000" />
              {/* Left stroke: starts at D in digital (321, 883.5), draws left, up, and across top to center */}
              <path
                ref={borderMaskLeftRef}
                d="M 321 883.5 L 135 883.5 A 24 24 0 0 1 111 859.5 L 111 528 A 24 24 0 0 1 135 504 L 602 504"
                fill="none"
                stroke="#ffffff"
                strokeWidth="50"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2500"
                strokeDashoffset="2500"
                style={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
              />
              {/* Right stroke: starts at last S in solution (1247, 883.5), draws right, up, and across top to center */}
              <path
                ref={borderMaskRightRef}
                d="M 1247 883.5 L 1433 883.5 A 24 24 0 0 0 1457 859.5 L 1457 528 A 24 24 0 0 0 1433 504 L 595 504"
                fill="none"
                stroke="#ffffff"
                strokeWidth="50"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="2500"
                strokeDashoffset="2500"
                style={{ strokeDasharray: 2500, strokeDashoffset: 2500 }}
              />
            </mask>
          </defs>

          {/* 1. LINE WITH BULB: Comes FIRST */}
          {/* Vertical connecting line: DRAWS down via stemDrawMask */}
          <path
            ref={stemRef}
            d={STEM_PATH}
            fill="#FFFFFF"
            fillRule="evenodd"
            mask="url(#stemDrawMask)"
            style={{ opacity: 0 }}
          />

          {/* Bulb (collar, highlights, base, and gradient bulb) */}
          <g ref={bulbGroupRef} style={{ opacity: 0 }}>
            <path d={BULB_WHITE_PATH} fill="#FFFFFF" fillRule="evenodd" />
            <path d={BULB_GRADIENT_PATH} fill="url(#bulbGradient)" fillRule="evenodd" />
          </g>

          {/* 2. TEXT & CHART: Fades in AFTER line and bulb */}
          <g ref={textGroupRef} style={{ opacity: 0, clipPath: 'inset(0 100% 0 0)' }}>
            <path d={TEXT_PATH} fill="#FFFFFF" fillRule="evenodd" />
          </g>

          {/* 3. RECTANGLE BORDER: Draws AT LAST from D in digital and last S in solution */}
          <path
            ref={borderPathRef}
            d={BORDER_PATH}
            fill="#FFFFFF"
            fillRule="evenodd"
            mask="url(#borderDrawMask)"
            style={{ opacity: 0 }}
          />
        </svg>
      </div>

      {/* Vignette */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]"
        aria-hidden="true"
      />
    </div>
  );
}
