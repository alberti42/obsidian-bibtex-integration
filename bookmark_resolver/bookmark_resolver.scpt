FasdUAS 1.101.10   ��   ��    k             x     �� ����    4    �� 
�� 
frmk  m     	 	 � 
 
  F o u n d a t i o n��        x    �� ����    2   ��
�� 
osax��        l     ��������  ��  ��        i        I      �� ���� 60 resolvebookmarkfrombase64 resolveBookmarkFromBase64   ��  o      ���� 0 base64string base64String��  ��    k     \       l     ��  ��    + % Decode the Base64 string into NSData     �   J   D e c o d e   t h e   B a s e 6 4   s t r i n g   i n t o   N S D a t a      r         n       !   I    �� "���� L0 $initwithbase64encodedstring_options_ $initWithBase64EncodedString_options_ "  # $ # o    ���� 0 base64string base64String $  %�� % m    	����  ��  ��   ! n     & ' & I    �������� 	0 alloc  ��  ��   ' n     ( ) ( o    ���� 0 nsdata NSData ) m     ��
�� misccura  o      ���� 0 bookmarkdata bookmarkData   * + * l   ��������  ��  ��   +  , - , l   �� . /��   . : 4 Check if the bookmark data was successfully decoded    / � 0 0 h   C h e c k   i f   t h e   b o o k m a r k   d a t a   w a s   s u c c e s s f u l l y   d e c o d e d -  1 2 1 Z     3 4���� 3 =     5 6 5 o    ���� 0 bookmarkdata bookmarkData 6 m    ��
�� 
msng 4 L     7 7 m     8 8 � 9 9 L E r r o r :   F a i l e d   t o   d e c o d e   B a s e 6 4   s t r i n g .��  ��   2  : ; : l   ��������  ��  ��   ;  < = < l   �� > ?��   > / ) Set up variables to resolve the bookmark    ? � @ @ R   S e t   u p   v a r i a b l e s   t o   r e s o l v e   t h e   b o o k m a r k =  A B A r    @ C D C n   ) E F E I     )�� G���� �0 Kurlbyresolvingbookmarkdata_options_relativetourl_bookmarkdataisstale_error_ KURLByResolvingBookmarkData_options_relativeToURL_bookmarkDataIsStale_error_ G  H I H o     !���� 0 bookmarkdata bookmarkData I  J K J m   ! "����   K  L M L l  " # N���� N m   " #��
�� 
msng��  ��   M  O P O l  # $ Q���� Q m   # $��
�� 
obj ��  ��   P  R�� R l  $ % S���� S m   $ %��
�� 
obj ��  ��  ��  ��   F n     T U T o     ���� 0 nsurl NSURL U m    ��
�� misccura D J       V V  W X W o      ���� 0 resolvedurl resolvedURL X  Y Z Y m      ��
�� 
msng Z  [�� [ o      ���� 	0 error  ��   B  \ ] \ l  A A��������  ��  ��   ]  ^ _ ^ l  A A�� ` a��   ` 4 . Check if there was an error during resolution    a � b b \   C h e c k   i f   t h e r e   w a s   a n   e r r o r   d u r i n g   r e s o l u t i o n _  c�� c Z   A \ d e�� f d =   A D g h g o   A B���� 0 resolvedurl resolvedURL h m   B C��
�� 
msng e L   G Q i i b   G P j k j m   G H l l � m m  E r r o r :   k l  H O n���� n c   H O o p o n  H M q r q I   I M�������� ,0 localizeddescription localizedDescription��  ��   r o   H I���� 	0 error   p m   M N��
�� 
ctxt��  ��  ��   f k   T \ s s  t u t l  T T�� v w��   v 2 , Return the resolved file path as POSIX path    w � x x X   R e t u r n   t h e   r e s o l v e d   f i l e   p a t h   a s   P O S I X   p a t h u  y�� y L   T \ z z c   T [ { | { n  T Y } ~ } I   U Y�������� 0 path  ��  ��   ~ o   T U���� 0 resolvedurl resolvedURL | m   Y Z��
�� 
ctxt��  ��      �  l     ��������  ��  ��   �  � � � l     �� � ���   � 8 2 Read the Base64 bookmark string from the argument    � � � � d   R e a d   t h e   B a s e 6 4   b o o k m a r k   s t r i n g   f r o m   t h e   a r g u m e n t �  � � � i     � � � I     �� ���
�� .aevtoappnull  �   � **** � o      ���� 0 argv  ��   � k      � �  � � � r      � � � n      � � � 4    �� �
�� 
cobj � m    ����  � o     ���� 0 argv   � o      ����  0 base64bookmark base64Bookmark �  ��� � L     � � I    �� ����� 60 resolvebookmarkfrombase64 resolveBookmarkFromBase64 �  ��� � o    	����  0 base64bookmark base64Bookmark��  ��  ��   �  ��� � l     ��������  ��  ��  ��       �� � � � � �������   � ������������
�� 
pimr�� 60 resolvebookmarkfrombase64 resolveBookmarkFromBase64
�� .aevtoappnull  �   � ****��  0 base64bookmark base64Bookmark��  ��   � �� ���  �   � � � �� ���
�� 
cobj �  � �   �� 	
�� 
frmk��   � �� ���
�� 
cobj �  � �   ��
�� 
osax��   � �� ���� � ����� 60 resolvebookmarkfrombase64 resolveBookmarkFromBase64�� �� ���  �  ���� 0 base64string base64String��   � ���������� 0 base64string base64String�� 0 bookmarkdata bookmarkData�� 0 resolvedurl resolvedURL�� 	0 error   � ������~�} 8�|�{�z�y�x l�w�v�u
�� misccura�� 0 nsdata NSData� 	0 alloc  �~ L0 $initwithbase64encodedstring_options_ $initWithBase64EncodedString_options_
�} 
msng�| 0 nsurl NSURL
�{ 
obj �z �y �0 Kurlbyresolvingbookmarkdata_options_relativetourl_bookmarkdataisstale_error_ KURLByResolvingBookmarkData_options_relativeToURL_bookmarkDataIsStale_error_
�x 
cobj�w ,0 localizeddescription localizedDescription
�v 
ctxt�u 0 path  �� ]��,j+ �jl+ E�O��  �Y hO��,�j����+ 	E[�k/E�Z[�l/u Z[�m/E�ZO��  �j+ �&%Y 
�j+ �& � �t ��s�r � ��q
�t .aevtoappnull  �   � ****�s 0 argv  �r   � �p�p 0 argv   � �o�n�m
�o 
cobj�n  0 base64bookmark base64Bookmark�m 60 resolvebookmarkfrombase64 resolveBookmarkFromBase64�q ��k/E�O*�k+  � � � �� Y m 9 v a 1 w E A A A A A A Q Q M A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A A T A M A A A U A A A A B A Q A A V X N l c n M A A A A G A A A A A Q E A A G F u Z H J l Y Q A A C Q A A A A E B A A B E b 2 N 1 b W V u d H M A A A A O A A A A A Q E A A F B h c G V y c y B s a W J y Y X J 5 A A A E A A A A A Q E A A D I w M j Q g A A A A A Q E A A G F y W G l 2 L T I 0 M D g u M D g 0 M j Q g M j A y N C B H a W J i b G U u c G R m G A A A A A E G A A A E A A A A F A A A A C Q A A A A 4 A A A A U A A A A F w A A A A I A A A A B A M A A N Z T A A A A A A A A C A A A A A Q D A A B j d w A A A A A A A A g A A A A E A w A A m 4 H E J g A A A A A I A A A A B A M A A I e L x C Y A A A A A C A A A A A Q D A A D 1 r M Q m A A A A A A g A A A A E A w A A v F / g J w A A A A A Y A A A A A Q Y A A K Q A A A C 0 A A A A x A A A A N Q A A A D k A A A A 9 A A A A A g A A A A A B A A A Q c Y 5 w N k A A A A Y A A A A A Q I A A A E A A A A A A A A A D w A A A A A A A A A A A A A A A A A A A A g A A A A E A w A A B A A A A A A A A A A E A A A A A w M A A P U B A A A I A A A A A Q k A A G Z p b G U 6 L y 8 v D A A A A A E B A A B N Y W N p b n R v c 2 g g S E Q I A A A A B A M A A A B w x N j R A Q A A C A A A A A A E A A B B x i / I B o A A A C Q A A A A B A Q A A M U M 4 N T E x N j M t Q T F F Q y 0 0 O D d B L U I y N j U t R T A 5 R D Y 1 M D E 0 N T F E G A A A A A E C A A C B A A A A A Q A A A O 8 T A A A B A A A A A A A A A A A A A A A B A A A A A Q E A A C 8 A A A A A A A A A A Q U A A B o A A A A B A Q A A T l N V U k x E b 2 N 1 b W V u d E l k Z W 5 0 a W Z p Z X J L Z X k A A A Q A A A A D A w A A 8 r 8 f C P 4 A A A A B A g A A M D N h N z Y 1 M j h k Y T U w Z T N h Y T E x Y T c x N T l l M T l i N G E 2 O G I 1 Y z Q z O D M 2 M D Z l Z D I 3 M D N j Y z k x O D E 5 Y 2 R k Z T A y Z j Q 4 O T s w M D s w M D A w M D A w M D s w M D A w M D A w M D s w M D A w M D A w M D s w M D A w M D A w M D A w M D A w M D I w O 2 N v b S 5 h c H B s Z S 5 h c H A t c 2 F u Z G J v e C 5 y Z W F k L X d y a X R l O z A x O z A x M D A w M D A 0 O z A w M D A w M D A w M j d l M D V m Y m M 7 M z U 7 L 3 V z Z X J z L 2 F u Z H J l Y S 9 k b 2 N 1 b W V u d H M v c G F w Z X J z I G x p Y n J h c n k v M j A y N C 9 h c n h p d i 0 y N D A 4 L j A 4 N D I 0 I D I w M j Q g Z 2 l i Y m x l L n B k Z g A A A N g A A A D + / / / / A Q A A A A A A A A A R A A A A B B A A A I Q A A A A A A A A A B R A A A A Q B A A A A A A A A E B A A A D Q B A A A A A A A A Q B A A A C Q B A A A A A A A A A i A A A A A C A A A A A A A A B S A A A H A B A A A A A A A A E C A A A I A B A A A A A A A A E S A A A L Q B A A A A A A A A E i A A A J Q B A A A A A A A A E y A A A K Q B A A A A A A A A I C A A A O A B A A A A A A A A M C A A A A w C A A A A A A A A A c A A A F Q B A A A A A A A A E c A A A B Q A A A A A A A A A E s A A A G Q B A A A A A A A A g P A A A E Q C A A A A A A A A F A I A g D g C A A A A A A A A��  ��   ascr  ��ޭ